import { getAppContext } from "@/lib/app-context";
import { submitItem, deleteItem, bulkDeleteItems, toggleListed } from "./actions";
import { allocatedCost, daysSince, fmtMoney } from "@/lib/calc";
import { CATEGORIES, CONDITIONS, type Item, type Pallet } from "@/lib/types";
import { AgingBadge, Card, EmptyState, Field, Pill, SectionTitle, TableWrap } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { BulkActionsBar } from "@/components/BulkActionsBar";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    error?: string;
    status?: string;
    pallet?: string;
    listed?: string;
    q?: string;
    imported?: string;
    skipped?: string;
    deleted?: string;
    deleteSkipped?: string;
  }>;
}) {
  const { supabase } = await getAppContext();
  const {
    edit,
    error,
    status = "all",
    pallet = "all",
    listed: listedFilter = "all",
    q = "",
    imported,
    skipped,
    deleted,
    deleteSkipped,
  } = await searchParams;

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
    if (listedFilter === "listed" && !i.listed) return false;
    if (listedFilter === "unlisted" && i.listed) return false;
    if (q && !i.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  if (!palletRows.length) {
    return (
      <section>
        <h2 className="text-[1.05rem] font-display font-semibold">Inventory</h2>
        <p className="text-sm text-ink-soft mb-4">Every item, broken out of every lot.</p>
        <EmptyState>Add a lot on the Lots tab first, then break it into items here.</EmptyState>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-[1.05rem] font-display font-semibold">Inventory</h2>
      <p className="text-sm text-ink-soft mb-4">Every item, broken out of every lot.</p>

      {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{error}</div>}
      {imported && (
        <div className="mb-4 text-sm bg-good-soft text-good rounded-lg px-3 py-2">
          Imported {imported} item{imported === "1" ? "" : "s"} from your spreadsheet.
          {skipped && ` Skipped ${skipped} row${skipped === "1" ? "" : "s"} with no item name.`}
        </div>
      )}
      {deleted && (
        <div className="mb-4 text-sm bg-good-soft text-good rounded-lg px-3 py-2">
          Deleted {deleted} item{deleted === "1" ? "" : "s"}.
          {deleteSkipped &&
            ` Skipped ${deleteSkipped} item${deleteSkipped === "1" ? "" : "s"} with a sale record — delete the sale first to remove ${deleteSkipped === "1" ? "it" : "those"}.`}
        </div>
      )}

      <Card>
        <form action={submitItem} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Lot">
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
          <Field label="Cost override ($)">
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost_override"
              defaultValue={editing?.cost_override ?? ""}
              placeholder="Auto-calculated"
            />
          </Field>
          <Field label="Note">
            <input name="note" defaultValue={editing?.note ?? ""} placeholder="Optional" />
          </Field>
          <label className="flex items-center gap-2 text-[0.78rem] text-ink-soft self-end pb-2">
            <input type="checkbox" name="listed" value="1" defaultChecked={editing?.listed ?? false} />
            Listed for sale
          </label>
          <div className="col-span-full flex flex-wrap gap-3 items-center mt-1">
            <button type="submit" className="bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2 text-sm shadow-sm hover:brightness-[1.08]">
              {editing ? "Save changes" : "Add item"}
            </button>
            {editing && (
              <a href="/items" className="text-ink-soft text-sm px-3 py-2">
                Cancel
              </a>
            )}
            <span className="text-xs text-ink-faint">
              Cost is split across a lot&apos;s items by retail value, unless you set a cost override.
            </span>
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
        <Field label="Lot">
          <AutoSubmitSelect name="pallet" defaultValue={pallet}>
            <option value="all">All lots</option>
            {palletRows.map((p) => (
              <option key={p.id} value={p.id}>
                {p.source}
              </option>
            ))}
          </AutoSubmitSelect>
        </Field>
        <Field label="Listed">
          <AutoSubmitSelect name="listed" defaultValue={listedFilter}>
            <option value="all">All</option>
            <option value="listed">Listed</option>
            <option value="unlisted">Not listed</option>
          </AutoSubmitSelect>
        </Field>
        <Field label="Search">
          <input name="q" defaultValue={q} placeholder="Item name…" />
        </Field>
        <button type="submit" className="self-end rounded-lg border border-line-strong px-3 py-2 text-sm shadow-sm hover:border-ink-soft h-[38px]">
          Filter
        </button>
      </form>

      <SectionTitle title="Items" hint={`${filtered.length} shown`} />
      {filtered.length ? (
        <form action={bulkDeleteItems}>
          <BulkActionsBar checkboxName="ids" itemLabel="item" />
          <TableWrap>
            <table className="w-full text-sm border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-surface-2 text-left text-[0.7rem] font-medium text-ink-soft">
                  <th className="px-2.5 py-2 w-8" />
                  <th className="px-2.5 py-2">Item</th>
                  <th className="px-2.5 py-2">Lot</th>
                  <th className="px-2.5 py-2">Category</th>
                  <th className="px-2.5 py-2">Condition</th>
                  <th className="px-2.5 py-2 text-right">Retail</th>
                  <th className="px-2.5 py-2 text-right">Alloc. Cost</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2">Listed</th>
                  <th className="px-2.5 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const p = palletsById.get(i.pallet_id);
                  const siblings = itemsByPallet.get(i.pallet_id) ?? [];
                  const cost = allocatedCost(i, p, siblings);
                  const sold = i.status === "sold";
                  return (
                    <tr key={i.id} className="border-t border-line">
                      <td className="px-2.5 py-2 align-middle">
                        <input
                          type="checkbox"
                          name="ids"
                          value={i.id}
                          disabled={sold}
                          title={sold ? "Delete the sale record first to remove a sold item." : undefined}
                        />
                      </td>
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
                      <td className="px-2.5 py-2 text-right mono">
                        {fmtMoney(cost)}
                        {i.cost_override != null && (
                          <span
                            className="ml-1 text-[0.62rem] font-sans font-medium text-accent align-middle"
                            title="Manually overridden"
                          >
                            •
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2">
                        {sold ? (
                          <Pill tone="sold">Sold</Pill>
                        ) : p ? (
                          <AgingBadge days={daysSince(p.purchase_date)} />
                        ) : (
                          <Pill tone="stock">In stock</Pill>
                        )}
                      </td>
                      <td className="px-2.5 py-2">
                        <button
                          type="submit"
                          formAction={toggleListed.bind(null, i.id, !i.listed)}
                          formNoValidate
                          className={`mono inline-flex items-center gap-1 text-[0.68rem] font-medium px-2.5 py-1 rounded-full ${
                            i.listed ? "bg-good-soft text-good" : "bg-surface-2 text-ink-soft border border-line-strong"
                          }`}
                        >
                          {i.listed ? "Listed" : "Not listed"}
                        </button>
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex gap-1.5">
                          {i.status !== "sold" && (
                            <a href={`/sales?item=${i.id}`} className="rounded-lg border border-line-strong px-2.5 py-1.5 text-[0.78rem] shadow-sm hover:border-ink-soft">
                              Sell
                            </a>
                          )}
                          <a href={`/items?edit=${i.id}`} className="rounded-lg border border-line-strong px-2.5 py-1.5 text-[0.78rem] shadow-sm hover:border-ink-soft">
                            Edit
                          </a>
                          <ConfirmDeleteButton formAction={deleteItem.bind(null, i.id)} confirmText="Delete this item? This can't be undone." />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </form>
      ) : (
        <EmptyState>No items match. Add one above or adjust filters.</EmptyState>
      )}
    </section>
  );
}
