import Link from "next/link";
import { Wallet, TrendingUp, DollarSign, Package, Percent, Star, Plus } from "lucide-react";
import { getAppContext } from "@/lib/app-context";
import { agingItems, bestSources, computeMetrics, fmtMoney, fmtMonth, monthlyPL } from "@/lib/calc";
import type { Expense, Item, Pallet, Sale } from "@/lib/types";
import { EmptyState, KpiTile, SectionTitle, TableWrap, AgingBadge, Pill } from "@/components/ui";

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

  const palletsById = new Map(data.pallets.map((p) => [p.id, p]));
  const recentItems = [...data.items]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[1.05rem] font-display font-semibold">Dashboard</h2>
          <p className="text-sm text-ink-soft">Your business at a glance.</p>
        </div>
        <Link
          href="/items"
          className="flex-none inline-flex items-center gap-1.5 bg-accent text-accent-ink font-semibold rounded-lg px-3.5 py-2 text-sm shadow-sm hover:brightness-[1.08]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Item
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
        <KpiTile
          label="Total Invested"
          value={fmtMoney(m.totalInvested)}
          hint="Lots + expenses"
          icon={<Wallet size={16} strokeWidth={2} />}
        />
        <KpiTile
          label="Revenue"
          value={fmtMoney(m.revenue)}
          hint={`${m.soldCount} items sold`}
          tone="good"
          icon={<TrendingUp size={16} strokeWidth={2} />}
        />
        <KpiTile
          label="Net Profit"
          value={fmtMoney(m.netProfit)}
          hint="After allocated cost & expenses"
          tone={m.netProfit >= 0 ? "good" : "alert"}
          icon={<DollarSign size={16} strokeWidth={2} />}
        />
        <KpiTile
          label="Inventory On Hand"
          value={fmtMoney(m.inventoryValue)}
          hint={`${m.inStockCount} items, at cost`}
          tone="info"
          icon={<Package size={16} strokeWidth={2} />}
        />
        <KpiTile
          label="Sell-Through"
          value={`${m.sellThrough.toFixed(0)}%`}
          hint={`of ${m.itemCount} items listed`}
          tone="violet"
          icon={<Percent size={16} strokeWidth={2} />}
        />
        <KpiTile
          label="Avg. Margin"
          value={`${m.avgMargin.toFixed(0)}%`}
          hint="on realized sales"
          tone="amber"
          icon={<Star size={16} strokeWidth={2} />}
        />
      </div>

      <SectionTitle title="Recent Items" hint={data.items.length ? `${data.items.length} total` : undefined} />
      {recentItems.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] font-medium text-ink-soft">
                <th className="px-2.5 py-2">Item</th>
                <th className="px-2.5 py-2">Lot</th>
                <th className="px-2.5 py-2">Category</th>
                <th className="px-2.5 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentItems.map((it) => (
                <tr key={it.id} className="border-t border-line">
                  <td className="px-2.5 py-2">{it.name}</td>
                  <td className="px-2.5 py-2">{palletsById.get(it.pallet_id)?.source ?? "—"}</td>
                  <td className="px-2.5 py-2">{it.category}</td>
                  <td className="px-2.5 py-2">
                    <Pill tone={it.status === "sold" ? "sold" : "stock"}>{it.status === "sold" ? "Sold" : "In stock"}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState>No items yet. Add a lot, then break it into items to get started.</EmptyState>
      )}

      <SectionTitle title="Aging inventory" hint="Unsold 30+ days since lot date" />
      {aging.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] font-medium text-ink-soft">
                <th className="px-2.5 py-2">Item</th>
                <th className="px-2.5 py-2">Lot</th>
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
                    <a href={`/sales?item=${x.item.id}`} className="rounded-lg border border-line-strong px-2.5 py-1.5 text-[0.78rem] shadow-sm hover:border-ink-soft">
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

      <SectionTitle title="Best lot sources" hint="Ranked by realized profit" />
      {sources.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] font-medium text-ink-soft">
                <th className="px-2.5 py-2">Source</th>
                <th className="px-2.5 py-2 text-right">Lots</th>
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
        <EmptyState>Add a lot to see source rankings.</EmptyState>
      )}

      <SectionTitle title="Monthly P&L" hint="Last 6 months with activity" />
      {months.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] font-medium text-ink-soft">
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
        <a href="/api/export/sales" className="rounded-lg border border-line-strong px-4 py-2 text-sm shadow-sm hover:border-ink-soft">
          Export sales (CSV)
        </a>
        <a href="/api/export/items" className="rounded-lg border border-line-strong px-4 py-2 text-sm shadow-sm hover:border-ink-soft">
          Export inventory (CSV)
        </a>
      </div>
    </section>
  );
}
