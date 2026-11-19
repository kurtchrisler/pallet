import { getAppContext } from "@/lib/app-context";
import { submitPallet, deletePallet } from "./actions";
import { buildIndex, fmtMoney, fmtDate, palletCostBasis } from "@/lib/calc";
import type { Item, Pallet, Sale } from "@/lib/types";
import { Card, EmptyState, Field } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { ImportItemsForm } from "@/components/ImportItemsForm";

type LotStatus = "unlisted" | "listing" | "paid_back";

const STATUS_META: Record<LotStatus, { label: string; dot: string; chip: string }> = {
  unlisted: { label: "Unlisted", dot: "bg-ink-faint", chip: "bg-surface-2 text-ink-soft" },
  listing: { label: "Listing", dot: "bg-info", chip: "bg-info-soft text-info" },
  paid_back: { label: "Paid back", dot: "bg-good", chip: "bg-good-soft text-good" },
};

const FILTERS: { key: "all" | LotStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid_back", label: "Paid back" },
  { key: "listing", label: "Listing" },
  { key: "unlisted", label: "Unlisted" },
];

function classify(revenue: number, costBasis: number, soldCount: number, listedCount: number): LotStatus {
  if (costBasis > 0 && revenue >= costBasis) return "paid_back";
  if (soldCount > 0 || listedCount > 0) return "listing";
  return "unlisted";
}

export default async function PalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; import?: string; error?: string; status?: string }>;
}) {
  const { supabase, user } = await getAppContext();
  const { edit, import: importPalletId, error, status: statusFilter = "all" } = await searchParams;

  const [{ data: pallets }, { data: items }, { data: sales }] = await Promise.all([
    supabase.from("pallets").select("*").order("purchase_date", { ascending: false }),
    supabase.from("items").select("*"),
    supabase.from("sales").select("*"),
  ]);

  const palletRows = (pallets ?? []) as Pallet[];
  const itemRows = (items ?? []) as Item[];
  const saleRows = (sales ?? []) as Sale[];
  const { itemsByPallet, saleByItem } = buildIndex({
    pallets: palletRows,
    items: itemRows,
    sales: saleRows,
    expenses: [],
  });

  const editing = edit ? palletRows.find((p) => p.id === edit) : null;
  const importing = importPalletId ? palletRows.find((p) => p.id === importPalletId) : null;
  const sources = Array.from(new Set(palletRows.map((p) => p.source)));

  const cards = palletRows.map((p) => {
    const its = itemsByPallet.get(p.id) ?? [];
    const sold = its.filter((i) => i.status === "sold");
    const listed = its.filter((i) => i.status !== "sold" && i.listed);
    const costBasis = palletCostBasis(p);
    const revenue = sold.reduce((s, i) => {
      const sale = saleByItem.get(i.id);
      return s + (sale ? Number(sale.price) : 0);
    }, 0);
    const netProfit = revenue - costBasis;
    const unsold = its.filter((i) => i.status !== "sold");
    const projectedRemaining = unsold.reduce((s, i) => s + (Number(i.est_value) || 0), 0);
    const countedUnits = unsold.filter((i) => Number(i.est_value) > 0).length;
    const recoveredPct = costBasis > 0 ? Math.min(revenue / costBasis, 1) * 100 : revenue > 0 ? 100 : 0;
    const projectedPct =
      costBasis > 0 ? Math.min((revenue + projectedRemaining) / costBasis, 1) * 100 : recoveredPct;
    const status = classify(revenue, costBasis, sold.length, listed.length);
    return { pallet: p, its, sold, listed, costBasis, revenue, netProfit, projectedRemaining, countedUnits, recoveredPct, projectedPct, status };
  });

  const counts = cards.reduce(
    (acc, c) => {
      acc[c.status] += 1;
      return acc;
    },
    { unlisted: 0, listing: 0, paid_back: 0 } as Record<LotStatus, number>
  );

  const visibleCards =
    statusFilter === "all" ? cards : cards.filter((c) => c.status === (statusFilter as LotStatus));

  return (
    <section>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-2xl font-display font-bold tracking-tight">Lots</h2>
          <p className="text-sm text-ink-soft mt-1">Every load you&apos;ve bought, and what it cost.</p>
        </div>

        <details className="contents" open={editing ? true : undefined}>
          <summary className="list-none cursor-pointer select-none inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-ink font-semibold text-sm px-4 py-2 shadow-sm hover:brightness-[1.08]">
            <span className="text-base leading-none">+</span> Add a lot
          </summary>
          <div className="basis-full">
            <Card className="mt-3">
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
                <Field label="Lot cost ($)">
                  <input type="number" step="0.01" min="0" name="cost" defaultValue={editing?.cost ?? ""} placeholder="0.00" />
                </Field>
                <Field label="Freight / pickup ($)">
                  <input type="number" step="0.01" min="0" name="freight" defaultValue={editing?.freight ?? ""} placeholder="0.00" />
                </Field>
                <Field label="Notes" wide>
                  <input name="notes" defaultValue={editing?.notes ?? ""} placeholder="Manifest #, condition, etc." />
                </Field>
                <div className="col-span-full flex gap-2 items-center mt-1">
                  <button type="submit" className="bg-accent text-accent-ink font-semibold rounded-full px-4 py-2 text-sm shadow-sm hover:brightness-[1.08]">
                    {editing ? "Save changes" : "Add lot"}
                  </button>
                  {editing && (
                    <a href="/pallets" className="text-ink-soft text-sm px-3 py-2">
                      Cancel
                    </a>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </details>
      </div>

      {error && <div className="mt-4 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{error}</div>}

      {importing && (
        <Card className="mt-4">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="text-sm font-display font-semibold">Import items into &quot;{importing.source}&quot;</h3>
            <a href="/pallets" className="text-ink-soft text-xs px-1">
              Cancel
            </a>
          </div>
          <ImportItemsForm palletId={importing.id} palletSource={importing.source} />
        </Card>
      )}

      {palletRows.length ? (
        <>
          <div className="flex flex-wrap gap-2 mt-6 mb-5">
            {FILTERS.map((f) => {
              const active = statusFilter === f.key;
              const count = f.key === "all" ? cards.length : counts[f.key];
              return (
                <a
                  key={f.key}
                  href={f.key === "all" ? "/pallets" : `/pallets?status=${f.key}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-accent text-accent-ink" : "bg-surface border border-line-strong text-ink-soft hover:border-ink-soft"
                  }`}
                >
                  {f.label}
                  <span className={active ? "opacity-70" : "text-ink-faint"}>{count}</span>
                </a>
              );
            })}
          </div>

          {visibleCards.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleCards.map(({ pallet: p, its, sold, listed, costBasis, revenue, netProfit, projectedRemaining, countedUnits, recoveredPct, projectedPct, status }) => {
                const meta = STATUS_META[status];
                return (
                  <Card key={p.id} className="flex flex-col">
                    <h3 className="font-display font-semibold text-[0.95rem] leading-snug">{p.source}</h3>
                    {p.notes && <div className="text-xs text-ink-faint mt-0.5">{p.notes}</div>}

                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${meta.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>

                    <div className="text-xs text-ink-faint mt-2">
                      bought {fmtDate(p.purchase_date)} · {its.length} item{its.length === 1 ? "" : "s"}
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="mono text-2xl font-bold tracking-tight">{fmtMoney(costBasis)}</span>
                      <span className="text-xs text-ink-soft">invested</span>
                    </div>
                    {sold.length > 0 && (
                      <div className={`text-xs font-medium mt-0.5 ${netProfit >= 0 ? "text-good" : "text-alert"}`}>
                        {netProfit >= 0 ? "+" : ""}
                        {fmtMoney(netProfit)} net so far
                      </div>
                    )}

                    <div className="h-2 rounded-full bg-surface-2 overflow-hidden flex mt-3">
                      {its.length > 0 && sold.length > 0 && (
                        <div className="bg-good" style={{ width: `${(sold.length / its.length) * 100}%` }} />
                      )}
                      {its.length > 0 && listed.length > 0 && (
                        <div className="bg-info" style={{ width: `${(listed.length / its.length) * 100}%` }} />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-ink-soft">
                      {sold.length > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-good" />
                          {sold.length} sold
                        </span>
                      )}
                      {listed.length > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-info" />
                          {listed.length} listed
                        </span>
                      )}
                      {sold.length === 0 && listed.length === 0 && <span>No items listed yet</span>}
                    </div>

                    <div className="border-t border-dashed border-line my-3" />

                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-ink-soft">Back so far</span>
                      <span className="font-semibold mono">
                        {fmtMoney(revenue)} · {Math.round(recoveredPct)}%
                      </span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-surface-2 overflow-hidden mt-2">
                      <div className="absolute inset-y-0 left-0 bg-good rounded-full" style={{ width: `${recoveredPct}%` }} />
                      {projectedPct > recoveredPct && (
                        <div
                          className="absolute inset-y-0"
                          style={{
                            left: `${recoveredPct}%`,
                            width: `${projectedPct - recoveredPct}%`,
                            backgroundColor: "var(--good-soft)",
                            backgroundImage:
                              "repeating-linear-gradient(45deg, var(--good) 0 2px, transparent 2px 7px)",
                            opacity: 0.8,
                          }}
                        />
                      )}
                    </div>
                    {projectedRemaining > 0 && (
                      <div className="flex items-center justify-between gap-2 mt-2 text-xs">
                        <span className="text-ink-soft">
                          ~{fmtMoney(projectedRemaining)} more from {countedUnits} counted unit{countedUnits === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-amber-soft text-amber font-medium px-2 py-0.5">
                          Estimate
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-line">
                      <a href={`/scan?pallet=${p.id}`} className="rounded-full border border-line-strong px-3 py-1.5 text-[0.78rem] shadow-sm hover:border-ink-soft">
                        Scan
                      </a>
                      <a href={`/pallets?import=${p.id}`} className="rounded-full border border-line-strong px-3 py-1.5 text-[0.78rem] shadow-sm hover:border-ink-soft">
                        Import
                      </a>
                      <a href={`/pallets?edit=${p.id}`} className="rounded-full border border-line-strong px-3 py-1.5 text-[0.78rem] shadow-sm hover:border-ink-soft">
                        Edit
                      </a>
                      <form action={deletePallet}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmDeleteButton
                          confirmText={
                            its.length
                              ? `Delete this lot and all ${its.length} item${its.length === 1 ? "" : "s"} in it, including any sale records? This can't be undone.`
                              : "Delete this lot? This can't be undone."
                          }
                        />
                      </form>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState>No lots match this filter.</EmptyState>
          )}
        </>
      ) : (
        <EmptyState>No lots yet for {user.email} — add your first one above.</EmptyState>
      )}
    </section>
  );
}
