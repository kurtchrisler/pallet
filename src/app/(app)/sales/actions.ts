"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

export async function submitSale(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");
  const itemId = String(formData.get("item_id") || "");

  const payload = {
    sale_date: String(formData.get("sale_date") || "") || new Date().toISOString().slice(0, 10),
    price: Number(formData.get("price") || 0),
    buyer: String(formData.get("buyer") || "").trim(),
    channel: String(formData.get("channel") || "").trim() || "Other",
    payment: String(formData.get("payment") || "").trim() || "Cash",
    note: String(formData.get("note") || "").trim(),
  };

  if (id) {
    await supabase.from("sales").update(payload).eq("id", id);
  } else {
    if (!itemId) {
      redirect("/sales?error=" + encodeURIComponent("Pick an item to sell."));
    }
    // A DB trigger flips the item's status to 'sold' the moment this insert lands.
    await supabase.from("sales").insert({ ...payload, item_id: itemId });
  }

  revalidatePath("/sales");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");
  redirect("/sales");
}

export async function deleteSale(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");
  // A DB trigger flips the item back to 'in_stock' the moment this delete lands.
  await supabase.from("sales").delete().eq("id", id);
  revalidatePath("/sales");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");
  redirect("/sales");
}
