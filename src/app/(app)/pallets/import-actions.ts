"use server";

import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/app-context";
import { MAX_ITEMS, type MappedItem } from "@/lib/import-mapping";

export type ImportResult = { ok: true; imported: number } | { ok: false; error: string };

/** Called from the client-side ImportItemsForm after the user has parsed
 * their spreadsheet in the browser and confirmed the column mapping — the
 * rows arrive already shaped, so this just re-validates and inserts them.
 * (Same trust model as the plain item form: the server still owns
 * trimming, defaults, and the row cap, since a client can send whatever it
 * wants regardless of what the mapping UI showed.) */
export async function submitMappedItems(palletId: string, items: MappedItem[]): Promise<ImportResult> {
  const { supabase } = await getAppContext();

  if (!palletId) {
    return { ok: false, error: "Choose a pallet to import into." };
  }

  const { data: pallet } = await supabase.from("pallets").select("id").eq("id", palletId).maybeSingle();
  if (!pallet) {
    return { ok: false, error: "That pallet couldn't be found." };
  }

  const toInsert = (Array.isArray(items) ? items : [])
    .filter((i) => i && typeof i.name === "string" && i.name.trim())
    .slice(0, MAX_ITEMS)
    .map((i) => ({
      pallet_id: palletId,
      name: i.name.trim().slice(0, 500),
      category: (i.category || "Other").toString().trim().slice(0, 200) || "Other",
      condition: (i.condition || "Good").toString().trim().slice(0, 100) || "Good",
      est_value: Number.isFinite(Number(i.est_value)) ? Math.max(0, Number(i.est_value)) : 0,
      note: (i.note || "").toString().trim().slice(0, 1000),
    }));

  if (!toInsert.length) {
    return { ok: false, error: "No items to import — check that a column is mapped to Item Name." };
  }

  const { error } = await supabase.from("items").insert(toInsert);
  if (error) {
    return { ok: false, error: "Import failed: " + error.message };
  }

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");

  return { ok: true, imported: toInsert.length };
}
