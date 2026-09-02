"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

export async function submitItem(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");
  const palletId = String(formData.get("pallet_id") || "");

  if (!palletId) {
    redirect("/items?error=" + encodeURIComponent("Add a pallet first."));
  }

  const payload = {
    pallet_id: palletId,
    name: String(formData.get("name") || "").trim() || "Unnamed item",
    brand: String(formData.get("brand") || "").trim(),
    category: String(formData.get("category") || "").trim() || "Other",
    condition: String(formData.get("condition") || "Good"),
    upc: String(formData.get("upc") || "").trim(),
    item_number: String(formData.get("item_number") || "").trim(),
    est_value: Number(formData.get("est_value") || 0),
    retail_value: Number(formData.get("retail_value") || 0),
    note: String(formData.get("note") || "").trim(),
  };

  if (id) {
    await supabase.from("items").update(payload).eq("id", id);
  } else {
    await supabase.from("items").insert(payload);
  }

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");
  redirect("/items");
}

export async function deleteItem(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");

  const { data: sale } = await supabase.from("sales").select("id").eq("item_id", id).maybeSingle();
  if (sale) {
    redirect("/items?error=" + encodeURIComponent("Delete the sale record for this item first."));
  }

  await supabase.from("items").delete().eq("id", id);
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");
  redirect("/items");
}
