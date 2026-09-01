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

export async function deletePallet(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");

  const { count } = await supabase.from("items").select("id", { count: "exact", head: true }).eq("pallet_id", id);
  if (count && count > 0) {
    redirect("/pallets?error=" + encodeURIComponent("Delete or reassign this pallet's items first."));
  }

  await supabase.from("pallets").delete().eq("id", id);
  revalidatePath("/pallets");
  revalidatePath("/dashboard");
  redirect("/pallets");
}
