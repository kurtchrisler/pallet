import { getAppContext } from "@/lib/app-context";
import { submitPallet, deletePallet } from "./actions";
import { buildIndex, fmtMoney, fmtDate, palletCostBasis } from "@/lib/calc";
import type { Item, Pallet, Sale } from "@/lib/types";
import { Card, EmptyState, Field, SectionTitle, TableWrap } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ImportItemsForm } from "@/components/ImportItemsForm";

export default async function PalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; import?: string; error?: string }>;
}) {
  const { supabase, user } = await getAppContext();
  const { edit, import: importPalletId, error } = await searchParams;

  const [{ data: pallets }, { data: items }, { data: sales }] = await Promise.all([
    supabase.from("pallets").select("*").order("purchase_date", { ascending: false }),
    supabase.from("items").select("*"),
    supabase.from("sales").select("*"),
  ]);

  const palletRows = (pallets ?? []) as Pallet[];
  const itemRows = (items ?? []) as Item[];
  const saleRows = (sales ?? []) as Sale[];
  const { itemsByPallet, saleByItem, costByItem } = buildIndex({
    pallets: palletRows,
    items: itemRows,
    sales: saleRows,
    expenses: [],
  });

  const editing = edit ? palletRows.find((p) => p.id === edit) : null;
  const importing = importPalletId ? palletRows.find((p) => p.id === importPalletId) : null;
  const sources = Array.from(new Set(palletRows.map((p) => p.source)));

  return (
    <section>
      <h2 className="text-[1.05rem] font-display font-semibold">Pallets</h2>
      <p className="text-sm text-ink-soft mb-4">Every load you&apos;ve bought, and what it cost.</p>

      {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded px-3 py-2">{error}</div>}

      <Card>
        <form action={submitPallet} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Source / Retailer">
            <input name="source" list="sourceList" required defaultValue={editing?.source ?? ""} placeholder="e.g. Home Depot Returns" />
            <datalist id="sourceList">
              {sources.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Pickup date">
            <input type="date" name="purchase_date" defaultValue={editing?.purchase_date ?? new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Pallet cost ($)">
            <input type="number" step="0.01" min="0" name="cost" defaultValue={editing?.cost ?? ""} placeholder="0.00" />
          </Field>
          <Field label="Freight / pickup ($)">
            <input type="number" step="0.01" min="0" name="freight" defaultValue={editing?.freight ?? ""} placeholder="0.00" />
          </Field>
          <Field label="Notes" wide>
            <input name="notes" defaultValue={editing?.notes ?? ""} placeholder="Manifest #, condition, etc." />
          </Field>
          <div className="col-span-full flex gap-2 items-center mt-1">
            <button type="submit" className="bg-accent text-accent-ink font-semibold rounded px-4 py-2 text-sm hover:brightness-[1.06]">
              {editing ? "Save changes" : "Add pallet"}
            </button>
            {editing && (
              <a href="/pallets" className="text-ink-soft text-sm px-3 py-2">
                Cancel
              </a>
            )}
          </div>
        </form>
      </Card>

      {importing && (
        <Card>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="text-sm font-display font-semibold">Import items into &quot;{importing.source}&quot;</h3>
            <a href="/pallets" className="text-ink-soft text-xs px-1">
              Cancel
            </a>
          </div>
          <ImportItemsForm palletId={importing.id} palletSource={importing.source} />
        </Card>
      )}

      <SectionTitle title="All pallets" hint={`${palletRows.length} total`} />
      {palletRows.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] uppercase tracking-wide text-ink-soft">
                <th className="px-2.5 py-2">Source</th>
                <th className="px-2.5 py-2">Date</th>
                <th className="px-2.5 py-2 text-right">Cost+Freight</th>
                <th className="px-2.5 py-2 text-right">Items</th>
                <th className="px-2.5 py-2 text-right">Sold</th>
                <th className="px-2.5 py-2 text-right">Profit</th>
                <th className="px-2.5 py-2" />
              </tr>
            </thead>
            <tbody>
              {palletRows.map((p) => {
                const its = itemsByPallet.get(p.id) ?? [];
                const sold = its.filter((i) => i.status === "sold");
                const profit = sold.reduce((s, i) => {
                  const sale = saleByItem.get(i.id);
                  return s + (sale ? Number(sale.price) - (costByItem.get(i.id) ?? 0) : 0);
                }, 0);
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-2.5 py-2 align-middle">
                      {p.source}
                      {p.notes && <div className="text-xs text-ink-faint">{p.notes}</div>}
                    </td>
                    <td className="px-2.5 py-2 mono">{fmtDate(p.purchase_date)}</td>
                    <td className="px-2.5 py-2 text-right mono">{fmtMoney(palletCostBasis(p))}</td>
                    <td className="px-2.5 py-2 text-right">{its.length}</td>
                    <td className="px-2.5 py-2 text-right">{sold.length}</td>
                    <td className={`px-2.5 py-2 text-right mono ${profit >= 0 ? "text-good" : "text-alert"}`}>
                      {sold.length ? fmtMoney(profit) : "—"}
                    </td>
                    <td className="px-2.5 py-2">
                      <div className="flex gap-1.5">
                        <a href={`/pallets?import=${p.id}`} className="rounded border border-line-strong px-2.5 py-1.5 text-[0.78rem]">
                          Import
                        </a>
                        <a href={`/pallets?edit=${p.id}`} className="rounded border border-line-strong px-2.5 py-1.5 text-[0.78rem]">
                          Edit
                        </a>
                        <form action={deletePallet}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmDeleteButton
                            confirmText={
                              its.length
                                ? `Delete this pallet and all ${its.length} item${its.length === 1 ? "" : "s"} in it, including any sale records? This can't be undone.`
                                : "Delete this pallet? This can't be undone."
                            }
                          />
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
        <EmptyState>No pallets yet for {user.email} — add your first one above.</EmptyState>
      )}
    </section>
  );
}
