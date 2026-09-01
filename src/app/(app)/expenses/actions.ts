"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";

export async function submitExpense(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");

  const payload = {
    expense_date: String(formData.get("expense_date") || "") || new Date().toISOString().slice(0, 10),
    category: String(formData.get("category") || "").trim() || "Other",
    amount: Number(formData.get("amount") || 0),
    note: String(formData.get("note") || "").trim(),
  };

  if (id) {
    await supabase.from("expenses").update(payload).eq("id", id);
  } else {
    await supabase.from("expenses").insert(payload);
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirect("/expenses");
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await getAppContext();
  const id = String(formData.get("id") || "");
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirect("/expenses");
}
