"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { getAppContext } from "@/lib/app-context";

// Safety caps so one bad file can't hammer the database.
const MAX_INPUT_ROWS = 1000;
const MAX_QTY_PER_ROW = 200;
const MAX_ITEMS = 2000;

// Spreadsheet headers are matched loosely — case, spaces, and punctuation
// all get stripped before comparing, so "Est. Value", "est_value" and
// "Estimated Value" all match the same column.
const NAME_KEYS = ["itemname", "item", "name", "description", "product", "productname"];
const CATEGORY_KEYS = ["category", "cat"];
const CONDITION_KEYS = ["condition"];
const QUANTITY_KEYS = ["quantity", "qty", "count"];
const VALUE_KEYS = [
  "estvalue",
  "estimatedvalue",
  "estimatedresalevalue",
  "resalevalue",
  "resaleprice",
  "value",
  "price",
];
const NOTE_KEYS = ["note", "notes", "comment", "comments"];

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const [rawKey, value] of Object.entries(row)) {
    if (keys.includes(normalizeKey(rawKey))) {
      const s = String(value ?? "").trim();
      if (s) return s;
    }
  }
  return "";
}

type ParsedItem = {
  pallet_id: string;
  name: string;
  category: string;
  condition: string;
  est_value: number;
  note: string;
};

export async function importItems(formData: FormData) {
  const { supabase } = await getAppContext();
  const palletId = String(formData.get("pallet_id") || "");
  const file = formData.get("file") as File | null;

  if (!palletId) {
    redirect("/pallets?error=" + encodeURIComponent("Choose a pallet to import into."));
  }

  if (!file || file.size === 0) {
    redirect(`/pallets?import=${palletId}&error=` + encodeURIComponent("Choose a spreadsheet file to upload."));
  }

  const fileName = file.name.toLowerCase();
  if (!/\.(csv|xlsx|xls)$/.test(fileName)) {
    redirect(`/pallets?import=${palletId}&error=` + encodeURIComponent("File must be a .csv, .xlsx, or .xls spreadsheet."));
  }

  let rows: Record<string, unknown>[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  } catch {
    redirect(
      `/pallets?import=${palletId}&error=` +
        encodeURIComponent("Could not read that file — make sure it's a valid spreadsheet.")
    );
  }

  const toInsert: ParsedItem[] = [];
  let skipped = 0;

  for (const row of rows.slice(0, MAX_INPUT_ROWS)) {
    const name = pick(row, NAME_KEYS);
    if (!name) {
      skipped++;
      continue;
    }

    const qtyRaw = Math.floor(Number(pick(row, QUANTITY_KEYS)));
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.min(qtyRaw, MAX_QTY_PER_ROW) : 1;

    const valueRaw = pick(row, VALUE_KEYS).replace(/[^0-9.-]/g, "");
    const estValue = Number(valueRaw) || 0;

    const category = pick(row, CATEGORY_KEYS) || "Other";
    const condition = pick(row, CONDITION_KEYS) || "Good";
    const note = pick(row, NOTE_KEYS);

    for (let i = 0; i < qty && toInsert.length < MAX_ITEMS; i++) {
      toInsert.push({ pallet_id: palletId, name, category, condition, est_value: estValue, note });
    }
  }

  if (!toInsert.length) {
    redirect(
      `/pallets?import=${palletId}&error=` +
        encodeURIComponent("No usable rows found — make sure your spreadsheet has an item name column.")
    );
  }

  const { error } = await supabase.from("items").insert(toInsert);
  if (error) {
    redirect(`/pallets?import=${palletId}&error=` + encodeURIComponent("Import failed: " + error.message));
  }

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");

  const params = new URLSearchParams({ pallet: palletId, imported: String(toInsert.length) });
  if (skipped) params.set("skipped", String(skipped));
  redirect(`/items?${params.toString()}`);
}
