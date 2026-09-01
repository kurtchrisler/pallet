import { getAppContext } from "@/lib/app-context";
import { agingItems, bestSources, computeMetrics, fmtMoney, fmtMonth, monthlyPL } from "@/lib/calc";
import type { Expense, Item, Pallet, Sale } from "@/lib/types";
import { EmptyState, KpiTile, SectionTitle, TableWrap, AgingBadge } from "@/components/ui";

export default async function DashboardPage() {
  const { supabase } = await getAppContext();

  const [{ data: pallets }, { data: items }, { data: sales }, { data: expenses }] = await Promise.all([
    supabase.from("pallets").select("*"),
    supabase.from("items").select("*"),
    supabase.from("sales").select("*"),
    supabase.from("expenses").select("*"),
  ]);

  const data = {
    pallets: (pallets ?? []) as Pallet[],
    items: (items ?? []) as Item[],
    sales: (sales ?? []) as Sale[],
    expenses: (expenses ?? []) as Expense[],
  };

  const m = computeMetrics(data);
  const sources = bestSources(data).slice(0, 5);
  const months = monthlyPL(data);
  const aging = agingItems(data, 30).slice(0, 6);

  return (
    <section>
      <h2 className="text-[1.05rem] font-display font-semibold">Dashboard</h2>
      <p className="text-sm text-ink-soft mb-4">Your business at a glance.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
        <KpiTile label="Total Invested" value={fmtMoney(m.totalInvested)} hint="Pallets + expenses" />
        <KpiTile label="Revenue" value={fmtMoney(m.revenue)} hint={`${m.soldCount} items sold`} tone="good" />
        <KpiTile
          label="Net Profit"
          value={fmtMoney(m.netProfit)}
          hint="After allocated cost & expenses"
          tone={m.netProfit >= 0 ? "good" : "alert"}
        />
        <KpiTile label="Inventory On Hand" value={fmtMoney(m.inventoryValue)} hint={`${m.inStockCount} items, at cost`} />
        <KpiTile label="Sell-Through" value={`${m.sellThrough.toFixed(0)}%`} hint={`of ${m.itemCount} items listed`} />
        <KpiTile label="Avg. Margin" value={`${m.avgMargin.toFixed(0)}%`} hint="on realized sales" />
      </div>

      <SectionTitle title="Aging inventory" hint="Unsold 30+ days since pallet date" />
      {aging.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] uppercase tracking-wide text-ink-soft">
                <th className="px-2.5 py-2">Item</th>
                <th className="px-2.5 py-2">Pallet</th>
                <th className="px-2.5 py-2">Category</th>
                <th className="px-2.5 py-2">Age</th>
                <th className="px-2.5 py-2" />
              </tr>
            </thead>
            <tbody>
              {aging.map((x) => (
                <tr key={x.item.id} className="border-t border-line">
                  <td className="px-2.5 py-2">{x.item.name}</td>
                  <td className="px-2.5 py-2">{x.pallet?.source ?? "—"}</td>
                  <td className="px-2.5 py-2">{x.item.category}</td>
                  <td className="px-2.5 py-2">
                    <AgingBadge days={x.days} />
                  </td>
                  <td className="px-2.5 py-2">
                    <a href={`/sales?item=${x.item.id}`} className="rounded border border-line-strong px-2.5 py-1.5 text-[0.78rem]">
                      Log sale
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState>Nothing aging past 30 days. Nice.</EmptyState>
      )}

      <SectionTitle title="Best pallet sources" hint="Ranked by realized profit" />
      {sources.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] uppercase tracking-wide text-ink-soft">
                <th className="px-2.5 py-2">Source</th>
                <th className="px-2.5 py-2 text-right">Pallets</th>
                <th className="px-2.5 py-2 text-right">Spend</th>
                <th className="px-2.5 py-2 text-right">Items Sold</th>
                <th className="px-2.5 py-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source} className="border-t border-line">
                  <td className="px-2.5 py-2">{s.source}</td>
                  <td className="px-2.5 py-2 text-right">{s.palletCount}</td>
                  <td className="px-2.5 py-2 text-right mono">{fmtMoney(s.spend)}</td>
                  <td className="px-2.5 py-2 text-right mono">{s.itemsSold}</td>
                  <td className={`px-2.5 py-2 text-right mono ${s.profit >= 0 ? "text-good" : "text-alert"}`}>{fmtMoney(s.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState>Add a pallet to see source rankings.</EmptyState>
      )}

      <SectionTitle title="Monthly P&L" hint="Last 6 months with activity" />
      {months.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] uppercase tracking-wide text-ink-soft">
                <th className="px-2.5 py-2">Month</th>
                <th className="px-2.5 py-2 text-right">Revenue</th>
                <th className="px-2.5 py-2 text-right">Allocated Cost</th>
                <th className="px-2.5 py-2 text-right">Expenses</th>
                <th className="px-2.5 py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {months.map((mo) => {
                const net = mo.revenue - mo.cost - mo.expenses;
                return (
                  <tr key={mo.key} className="border-t border-line">
                    <td className="px-2.5 py-2">{fmtMonth(mo.key)}</td>
                    <td className="px-2.5 py-2 text-right mono">{fmtMoney(mo.revenue)}</td>
                    <td className="px-2.5 py-2 text-right mono">{fmtMoney(mo.cost)}</td>
                    <td className="px-2.5 py-2 text-right mono">{fmtMoney(mo.expenses)}</td>
                    <td className={`px-2.5 py-2 text-right mono ${net >= 0 ? "text-good" : "text-alert"}`}>{fmtMoney(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState>Log a sale to see monthly profit and loss.</EmptyState>
      )}

      <div className="flex flex-wrap gap-2 mt-5">
        <a href="/api/export/sales" className="rounded border border-line-strong px-4 py-2 text-sm">
          Export sales (CSV)
        </a>
        <a href="/api/export/items" className="rounded border border-line-strong px-4 py-2 text-sm">
          Export inventory (CSV)
        </a>
      </div>
    </section>
  );
}
