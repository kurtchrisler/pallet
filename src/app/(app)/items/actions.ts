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
    listed: formData.get("listed") === "1",
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

/** `id` is a bound argument (each row does `deleteItem.bind(null, item.id)`
 * for its formAction) rather than a hidden form field — this button lives
 * inside the same shared <form> as every other row's delete/toggle button
 * and the bulk-select checkboxes, so a hidden `name="id"` input would
 * collide across rows and always submit whichever row's value happened to
 * come first in the DOM. Binding sidesteps that entirely. */
export async function deleteItem(id: string, formData: FormData) {
  const { supabase } = await getAppContext();
  void formData;

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

/** Deletes every checked item, same protection as the single-item delete:
 * an item with a sale record is skipped rather than deleted out from under
 * its sale (the checkbox for a sold item is disabled in the UI for the
 * same reason — this is the server-side backstop). */
export async function bulkDeleteItems(formData: FormData) {
  const { supabase } = await getAppContext();
  const ids = formData
    .getAll("ids")
    .map((v) => String(v))
    .filter(Boolean);

  if (!ids.length) {
    redirect("/items?error=" + encodeURIComponent("Select at least one item to delete."));
  }

  const { data: sold } = await supabase.from("sales").select("item_id").in("item_id", ids);
  const soldIds = new Set((sold ?? []).map((s) => s.item_id));
  const deletable = ids.filter((id) => !soldIds.has(id));

  if (deletable.length) {
    await supabase.from("items").delete().in("id", deletable);
  }

  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/pallets");

  const params = new URLSearchParams({ deleted: String(deletable.length) });
  const skipped = ids.length - deletable.length;
  if (skipped) params.set("deleteSkipped", String(skipped));
  redirect(`/items?${params.toString()}`);
}

/** Same bound-argument reasoning as deleteItem above. */
export async function toggleListed(id: string, listed: boolean, formData: FormData) {
  const { supabase } = await getAppContext();
  void formData;

  await supabase.from("items").update({ listed }).eq("id", id);
  revalidatePath("/items");
  redirect("/items");
}
