import { getAppContext } from "@/lib/app-context";
import { submitSale, deleteSale } from "./actions";
import { allocatedCost, fmtDate, fmtMoney } from "@/lib/calc";
import { CHANNELS, PAYMENTS, type Item, type Pallet, type Sale } from "@/lib/types";
import { Card, EmptyState, Field, SectionTitle, TableWrap } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; item?: string }>;
}) {
  const { supabase } = await getAppContext();
  const { edit, error, item: preselectItem } = await searchParams;

  const [{ data: pallets }, { data: items }, { data: sales }] = await Promise.all([
    supabase.from("pallets").select("*"),
    supabase.from("items").select("*"),
    supabase.from("sales").select("*").order("sale_date", { ascending: false }),
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

  const editing = edit ? saleRows.find((s) => s.id === edit) : null;
  const editingItem = editing ? itemsById.get(editing.item_id) : null;
  const available = itemRows.filter((i) => i.status !== "sold");

  return (
    <section>
      <h2 className="text-[1.05rem] font-display font-semibold">Sales</h2>
      <p className="text-sm text-ink-soft mb-4">What sold, to whom, and where.</p>

      {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded px-3 py-2">{error}</div>}

      <Card>
        {!editing && !available.length ? (
          <div className="text-sm text-ink-soft py-2">Add items in the Inventory tab before logging a sale.</div>
        ) : (
          <form action={submitSale} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            {editing ? (
              <Field label="Item">
                <input value={editingItem?.name ?? "(deleted item)"} disabled />
              </Field>
            ) : (
              <Field label="Item sold">
                <select name="item_id" defaultValue={preselectItem ?? ""}>
                  <option value="" disabled>
                    Choose an item…
                  </option>
                  {available.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — {palletsById.get(i.pallet_id)?.source ?? ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Sale date">
              <input type="date" name="sale_date" defaultValue={editing?.sale_date ?? new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Sale price ($)">
              <input type="number" step="0.01" min="0" name="price" required defaultValue={editing?.price ?? ""} placeholder="0.00" />
            </Field>
            <Field label="Buyer">
              <input name="buyer" defaultValue={editing?.buyer ?? ""} placeholder="Optional" />
            </Field>
            <Field label="Channel">
              <input name="channel" list="channelList" defaultValue={editing?.channel ?? ""} placeholder="Where it sold" />
              <datalist id="channelList">
                {CHANNELS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Payment method">
              <input name="payment" list="paymentList" defaultValue={editing?.payment ?? ""} placeholder="How you got paid" />
              <datalist id="paymentList">
                {PAYMENTS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Note" wide>
              <input name="note" defaultValue={editing?.note ?? ""} placeholder="Optional" />
            </Field>
            <div className="col-span-full flex gap-2 items-center mt-1">
              <button type="submit" className="bg-accent text-accent-ink font-semibold rounded px-4 py-2 text-sm hover:brightness-[1.06]">
                {editing ? "Save changes" : "Log sale"}
              </button>
              {editing && (
                <a href="/sales" className="text-ink-soft text-sm px-3 py-2">
                  Cancel
                </a>
              )}
            </div>
          </form>
        )}
      </Card>

      <SectionTitle title="Sale history" hint={`${saleRows.length} total`} />
      {saleRows.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] uppercase tracking-wide text-ink-soft">
                <th className="px-2.5 py-2">Date</th>
                <th className="px-2.5 py-2">Item</th>
                <th className="px-2.5 py-2">Channel</th>
                <th className="px-2.5 py-2">Buyer</th>
                <th className="px-2.5 py-2 text-right">Price</th>
                <th className="px-2.5 py-2 text-right">Profit</th>
                <th className="px-2.5 py-2" />
              </tr>
            </thead>
            <tbody>
              {saleRows.map((s) => {
                const it = itemsById.get(s.item_id);
                const pallet = it ? palletsById.get(it.pallet_id) : undefined;
                const siblings = it ? itemsByPallet.get(it.pallet_id) ?? [] : [];
                const cost = it ? allocatedCost(it, pallet, siblings) : 0;
                const profit = Number(s.price) - cost;
                return (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-2.5 py-2 mono">{fmtDate(s.sale_date)}</td>
                    <td className="px-2.5 py-2">{it?.name ?? "(deleted item)"}</td>
                    <td className="px-2.5 py-2">{s.channel}</td>
                    <td className="px-2.5 py-2">{s.buyer || "—"}</td>
                    <td className="px-2.5 py-2 text-right mono">{fmtMoney(s.price)}</td>
                    <td className={`px-2.5 py-2 text-right mono ${profit >= 0 ? "text-good" : "text-alert"}`}>{fmtMoney(profit)}</td>
                    <td className="px-2.5 py-2">
                      <div className="flex gap-1.5">
                        <a href={`/sales?edit=${s.id}`} className="rounded border border-line-strong px-2.5 py-1.5 text-[0.78rem]">
                          Edit
                        </a>
                        <form action={deleteSale}>
                          <input type="hidden" name="id" value={s.id} />
                          <ConfirmDeleteButton confirmText="Delete this sale? The item goes back to in-stock." />
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState>No sales logged yet.</EmptyState>
      )}
    </section>
  );
}
