"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

export async function submitPallet(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");

  const payload = {
    source: String(formData.get("source") || "").trim() || "Unknown source",
    purchase_date: String(formData.get("purchase_date") || "") || new Date().toISOString().slice(0, 10),
    cost: Number(formData.get("cost") || 0),
    freight: Number(formData.get("freight") || 0),
    notes: String(formData.get("notes") || "").trim(),
  };

  if (id) {
    await supabase.from("pallets").update(payload).eq("id", id);
  } else {
    await supabase.from("pallets").insert(payload);
  }

  revalidatePath("/pallets");
  revalidatePath("/dashboard");
  revalidatePath("/items");
  redirect("/pallets");
}

/** Deleting a pallet cascades at the database level to every item in it,
 * and from there to any sale recorded against those items (items.pallet_id
 * and sales.item_id are both `on delete cascade`) — so this one delete
 * removes the pallet, its items, and their sales in a single transaction. */
export async function deletePallet(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");

  await supabase.from("pallets").delete().eq("id", id);
  revalidatePath("/pallets");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/sales");
  redirect("/pallets");
}
