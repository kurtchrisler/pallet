import { getAppContext } from "@/lib/app-context";
import { allocatedCost, toCSV } from "@/lib/calc";
import type { Item, Pallet, Sale } from "@/lib/types";

export async function GET() {
  const { supabase } = await getAppContext({ requireActive: false });

  const [{ data: pallets }, { data: items }, { data: sales }] = await Promise.all([
    supabase.from("pallets").select("*"),
    supabase.from("items").select("*"),
    supabase.from("sales").select("*"),
  ]);

  const palletRows = (pallets ?? []) as Pallet[];
  const itemRows = (items ?? []) as Item[];
  const saleRows = (sales ?? []) as Sale[];
  const palletsById = new Map(palletRows.map((p) => [p.id, p]));
  const saleByItem = new Map(saleRows.map((s) => [s.item_id, s]));
  const itemsByPallet = new Map<string, Item[]>();
  for (const it of itemRows) {
    const arr = itemsByPallet.get(it.pallet_id) ?? [];
    arr.push(it);
    itemsByPallet.set(it.pallet_id, arr);
  }

  const rows: unknown[][] = [
    [
      "Item",
      "Pallet Source",
      "Pallet Date",
      "Category",
      "Condition",
      "Est. Value",
      "Allocated Cost",
      "Status",
      "Sale Price",
      "Profit",
    ],
  ];
  for (const item of itemRows) {
    const pallet = palletsById.get(item.pallet_id);
    const siblings = itemsByPallet.get(item.pallet_id) ?? [];
    const cost = allocatedCost(item, pallet, siblings);
    const sale = saleByItem.get(item.id);
    rows.push([
      item.name,
      pallet?.source ?? "",
      pallet?.purchase_date ?? "",
      item.category,
      item.condition,
      Number(item.est_value).toFixed(2),
      cost.toFixed(2),
      item.status === "sold" ? "Sold" : "In Stock",
      sale ? Number(sale.price).toFixed(2) : "",
      sale ? (Number(sale.price) - cost).toFixed(2) : "",
    ]);
  }

  const csv = toCSV(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pallet-ledger-items-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
