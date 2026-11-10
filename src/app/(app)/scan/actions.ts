"use server";

import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/app-context";
import type { Item } from "@/lib/types";

export type UpcLookupResult = {
  match: Item | null;
  priorCount: number;
};

/** Looks up past items by UPC for the current user (RLS scopes this to
 * their own rows automatically, same as every other query in the app).
 * Returns the most recently logged item with this UPC — used to prefill
 * name/brand/category/condition/retail value on the scan screen — plus
 * how many times it's shown up before, so the UI can say "logged 3 times
 * before" rather than silently reusing old data without explanation. */
export async function lookupItemsByUpc(upc: string): Promise<UpcLookupResult> {
  const code = upc.trim();
  if (!code) return { match: null, priorCount: 0 };

  const { supabase } = await getAppContext();
  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("upc", code)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Item[];
  return { match: rows[0] ?? null, priorCount: rows.length };
}

export type CreateScannedItemInput = {
  pallet_id: string;
  name: string;
  brand: string;
  category: string;
  condition: string;
  upc: string;
  item_number: string;
  est_value: number;
  retail_value: number;
  note: string;
};

/** Same insert shape as items/actions.ts's submitItem, but returns the
 * created row instead of redirecting. The scan screen keeps the camera
 * running and adds items one after another without navigating away, so
 * it calls this directly as an async function from the client component
 * rather than using a <form action> (which would redirect after every
 * single scan and kill the camera stream each time). */
export async function createScannedItem(input: CreateScannedItemInput): Promise<Item> {
  const { supabase } = await getAppContext();

  const palletId = input.pallet_id.trim();
  if (!palletId) {
    throw new Error("Pick a lot to scan into first.");
  }
  const name = input.name.trim();
  if (!name) {
    throw new Error("Item needs a name.");
  }

  const payload = {
    pallet_id: palletId,
    name,
    brand: input.brand.trim(),
    category: input.category.trim() || "Other",
    condition: input.condition || "Good",
    upc: input.upc.trim(),
    item_number: input.item_number.trim(),
    est_value: Number(input.est_value) || 0,
    retail_value: Number(input.retail_value) || 0,
    cost_override: null,
    note: input.note.trim(),
    status: "in_stock" as const,
    listed: false,
  };

  const { data, error } = await supabase.from("items").insert(payload).select("*").single();
  if (error) throw new Error(error.message);

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");

  return data as Item;
}
