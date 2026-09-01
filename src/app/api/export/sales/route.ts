import { getAppContext } from "@/lib/app-context";
import { allocatedCost, toCSV } from "@/lib/calc";
import type { Item, Pallet, Sale } from "@/lib/types";

export async function GET() {
  const { supabase } = await getAppContext({ requireActive: false });

  const [{ data: pallets }, { data: items }, { data: sales }] = await Promise.all([
    supabase.from("pallets").select("*"),
    supabase.from("items").select("*"),
    supabase.from("sales").select("*").order("sale_date", { ascending: true }),
  ]);

  const palletRows = (pallets ?? []) as Pallet[];
  const itemRows = (items ?? []) as Item[];
  const saleRows = (sales ?? []) as Sale[];
  const palletsById = new Map(palletRows.map((p) => [p.id, p]));
  const itemsById = new Map(itemRows.map((i) => [i.id, i]));
  const itemsByPallet = new Map<string, Item[]>();
  for (const it of itemRows) {
    const arr = itemsByPallet.get(it.pallet_id) ?? [];
    arr.push(it);
    itemsByPallet.set(it.pallet_id, arr);
  }

  const rows: unknown[][] = [
    ["Date", "Item", "Pallet Source", "Category", "Buyer", "Channel", "Payment", "Sale Price", "Allocated Cost", "Profit"],
  ];
  for (const s of saleRows) {
    const item = itemsById.get(s.item_id);
    const pallet = item ? palletsById.get(item.pallet_id) : undefined;
    const siblings = item ? itemsByPallet.get(item.pallet_id) ?? [] : [];
    const cost = item ? allocatedCost(item, pallet, siblings) : 0;
    rows.push([
      s.sale_date,
      item?.name ?? "(deleted item)",
      pallet?.source ?? "",
      item?.category ?? "",
      s.buyer,
      s.channel,
      s.payment,
      Number(s.price).toFixed(2),
      cost.toFixed(2),
      (Number(s.price) - cost).toFixed(2),
    ]);
  }

  const csv = toCSV(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pallet-ledger-sales-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
