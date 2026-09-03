import { getAppContext } from "@/lib/app-context";
import { submitItem, deleteItem } from "./actions";
import { allocatedCost, daysSince, fmtMoney } from "@/lib/calc";
import { CATEGORIES, CONDITIONS, type Item, type Pallet } from "@/lib/types";
import { AgingBadge, Card, EmptyState, Field, Pill, SectionTitle, TableWrap } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    error?: string;
    status?: string;
    pallet?: string;
    q?: string;
    imported?: string;
    skipped?: string;
  }>;
}) {
  const { supabase } = await getAppContext();
  const { edit, error, status = "all", pallet = "all", q = "", imported, skipped } = await searchParams;

  const [{ data: pallets }, { data: items }] = await Promise.all([
    supabase.from("pallets").select("*").order("purchase_date", { ascending: false }),
    supabase.from("items").select("*").order("created_at", { ascending: false }),
  ]);

  const palletRows = (pallets ?? []) as Pallet[];
  const itemRows = (items ?? []) as Item[];
  const palletsById = new Map(palletRows.map((p) => [p.id, p]));
  const itemsByPallet = new Map<string, Item[]>();
  for (const it of itemRows) {
    const arr = itemsByPallet.get(it.pallet_id) ?? [];
    arr.push(it);
    itemsByPallet.set(it.pallet_id, arr);
  }

  const editing = edit ? itemRows.find((i) => i.id === edit) : null;

  const filtered = itemRows.filter((i) => {
    if (status !== "all" && i.status !== status) return false;
    if (pallet !== "all" && i.pallet_id !== pallet) return false;
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  if (!palletRows.length) {
    return (
      <section>
        <h2 className="text-[1.05rem] font-display font-semibold">Inventory</h2>
        <p className="text-sm text-ink-soft mb-4">Every item, broken out of every pallet.</p>
        <EmptyState>Add a pallet on the Pallets tab first, then break it into items here.</EmptyState>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-[1.05rem] font-display font-semibold">Inventory</h2>
      <p className="text-sm text-ink-soft mb-4">Every item, broken out of every pallet.</p>

      {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded px-3 py-2">{error}</div>}
      {imported && (
        <div className="mb-4 text-sm bg-good-soft text-good rounded px-3 py-2">
          Imported {imported} item{imported === "1" ? "" : "s"} from your spreadsheet.
          {skipped && ` Skipped ${skipped} row${skipped === "1" ? "" : "s"} with no item name.`}
        </div>
      )}

      <Card>
        <form action={submitItem} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Pallet">
            <select name="pallet_id" defaultValue={editing?.pallet_id ?? palletRows[0].id}>
              {palletRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.source} — {p.purchase_date}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Item name">
            <input name="name" required defaultValue={editing?.name ?? ""} placeholder="e.g. Cordless drill, open box" />
          </Field>
          <Field label="Brand">
            <input name="brand" defaultValue={editing?.brand ?? ""} placeholder="Optional" />
          </Field>
          <Field label="Category">
            <input name="category" list="catList" defaultValue={editing?.category ?? ""} placeholder="Category" />
            <datalist id="catList">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Condition">
            <select name="condition" defaultValue={editing?.condition ?? "Good"}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Item #">
            <input name="item_number" defaultValue={editing?.item_number ?? ""} placeholder="Optional" />
          </Field>
          <Field label="UPC">
            <input name="upc" defaultValue={editing?.upc ?? ""} placeholder="Optional" />
          </Field>
          <Field label="Retail value ($)">
            <input type="number" step="0.01" min="0" name="retail_value" defaultValue={editing?.retail_value ?? ""} placeholder="0.00" />
          </Field>
          <Field label="Est. resale value ($)">
            <input type="number" step="0.01" min="0" name="est_value" defaultValue={editing?.est_value ?? ""} placeholder="0.00" />
          </Field>
          <Field label="Note">
            <input name="note" defaultValue={editing?.note ?? ""} placeholder="Optional" />
          </Field>
          <div className="col-span-full flex flex-wrap gap-3 items-center mt-1">
            <button type="submit" className="bg-accent text-accent-ink font-semibold rounded px-4 py-2 text-sm hover:brightness-[1.06]">
              {editing ? "Save changes" : "Add item"}
            </button>
            {editing && (
              <a href="/items" className="text-ink-soft text-sm px-3 py-2">
                Cancel
              </a>
            )}
            <span className="text-xs text-ink-faint">Cost is split across a pallet&apos;s items by retail value.</span>
          </div>
        </form>
      </Card>

      <form method="get" className="flex flex-wrap gap-2.5 mt-4 mb-3.5">
        <Field label="Status">
          <AutoSubmitSelect name="status" defaultValue={status}>
            <option value="all">All</option>
            <option value="in_stock">In stock</option>
            <option value="sold">Sold</option>
          </AutoSubmitSelect>
        </Field>
        <Field label="Pallet">
          <AutoSubmitSelect name="pallet" defaultValue={pallet}>
            <option value="all">All pallets</option>
            {palletRows.map((p) => (
              <option key={p.id} value={p.id}>
                {p.source}
              </option>
            ))}
          </AutoSubmitSelect>
        </Field>
        <Field label="Search">
          <input name="q" defaultValue={q} placeholder="Item name…" />
        </Field>
        <button type="submit" className="self-end rounded border border-line-strong px-3 py-2 text-sm h-[38px]">
          Filter
        </button>
      </form>

      <SectionTitle title="Items" hint={`${filtered.length} shown`} />
      {filtered.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] uppercase tracking-wide text-ink-soft">
                <th className="px-2.5 py-2">Item</th>
                <th className="px-2.5 py-2">Pallet</th>
                <th className="px-2.5 py-2">Category</th>
                <th className="px-2.5 py-2">Condition</th>
                <th className="px-2.5 py-2 text-right">Retail</th>
                <th className="px-2.5 py-2 text-right">Alloc. Cost</th>
                <th className="px-2.5 py-2">Status</th>
                <th className="px-2.5 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const p = palletsById.get(i.pallet_id);
                const siblings = itemsByPallet.get(i.pallet_id) ?? [];
                const cost = allocatedCost(i, p, siblings);
                return (
                  <tr key={i.id} className="border-t border-line">
                    <td className="px-2.5 py-2">
                      {i.name}
                      {(i.brand || i.item_number || i.upc) && (
                        <div className="text-xs text-ink-faint">
                          {[i.brand, i.item_number && `#${i.item_number}`, i.upc && `UPC ${i.upc}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                      {i.note && <div className="text-xs text-ink-faint">{i.note}</div>}
                    </td>
                    <td className="px-2.5 py-2">{p?.source ?? "—"}</td>
                    <td className="px-2.5 py-2">{i.category}</td>
                    <td className="px-2.5 py-2">{i.condition}</td>
                    <td className="px-2.5 py-2 text-right mono">{i.retail_value ? fmtMoney(i.retail_value) : "—"}</td>
                    <td className="px-2.5 py-2 text-right mono">{fmtMoney(cost)}</td>
                    <td className="px-2.5 py-2">
                      {i.status === "sold" ? (
                        <Pill tone="sold">Sold</Pill>
                      ) : p ? (
                        <AgingBadge days={daysSince(p.purchase_date)} />
                      ) : (
                        <Pill tone="stock">In stock</Pill>
                      )}
                    </td>
                    <td className="px-2.5 py-2">
                      <div className="flex gap-1.5">
                        {i.status !== "sold" && (
                          <a href={`/sales?item=${i.id}`} className="rounded border border-line-strong px-2.5 py-1.5 text-[0.78rem]">
                            Sell
                          </a>
                        )}
                        <a href={`/items?edit=${i.id}`} className="rounded border border-line-strong px-2.5 py-1.5 text-[0.78rem]">
                          Edit
                        </a>
                        <form action={deleteItem}>
                          <input type="hidden" name="id" value={i.id} />
                          <ConfirmDeleteButton confirmText="Delete this item? This can't be undone." />
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
        <EmptyState>No items match. Add one above or adjust filters.</EmptyState>
      )}
    </section>
  );
}
