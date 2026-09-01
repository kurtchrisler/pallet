import type { Expense, Item, Pallet, Sale } from "./types";

/** Every derived number in the app flows through these pure functions, so
 * the dashboard, the tables and the CSV exports can never disagree. */

export function palletCostBasis(p: Pick<Pallet, "cost" | "freight">) {
  return Number(p.cost || 0) + Number(p.freight || 0);
}

export function allocatedCost(item: Item, pallet: Pallet | undefined, siblings: Item[]) {
  if (!pallet) return 0;
  const totalEst = siblings.reduce((s, i) => s + Number(i.est_value || 0), 0);
  const basis = palletCostBasis(pallet);
  if (totalEst > 0) return basis * (Number(item.est_value || 0) / totalEst);
  return siblings.length ? basis / siblings.length : 0;
}

export function daysSince(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export type LedgerData = {
  pallets: Pallet[];
  items: Item[];
  sales: Sale[];
  expenses: Expense[];
};

function indexBy<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((r) => [r.id, r]));
}

/** Builds fast lookups once per request so every helper below is O(1)/O(n)
 * instead of re-scanning arrays for every item. */
export function buildIndex(data: LedgerData) {
  const palletsById = indexBy(data.pallets);
  const itemsByPallet = new Map<string, Item[]>();
  for (const item of data.items) {
    const arr = itemsByPallet.get(item.pallet_id) ?? [];
    arr.push(item);
    itemsByPallet.set(item.pallet_id, arr);
  }
  const saleByItem = indexBy(data.sales.map((s) => ({ ...s, id: s.item_id })));

  const costByItem = new Map<string, number>();
  for (const item of data.items) {
    const pallet = palletsById.get(item.pallet_id);
    const siblings = itemsByPallet.get(item.pallet_id) ?? [];
    costByItem.set(item.id, allocatedCost(item, pallet, siblings));
  }

  return { palletsById, itemsByPallet, saleByItem, costByItem };
}

export function computeMetrics(data: LedgerData) {
  const { costByItem } = buildIndex(data);
  const palletSpend = data.pallets.reduce((s, p) => s + palletCostBasis(p), 0);
  const expenseSpend = data.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalInvested = palletSpend + expenseSpend;
  const revenue = data.sales.reduce((s, sale) => s + Number(sale.price || 0), 0);
  const soldItems = data.items.filter((i) => i.status === "sold");
  const inStockItems = data.items.filter((i) => i.status !== "sold");
  const cogs = soldItems.reduce((s, i) => s + (costByItem.get(i.id) ?? 0), 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenseSpend;
  const inventoryValue = inStockItems.reduce((s, i) => s + (costByItem.get(i.id) ?? 0), 0);
  const sellThrough = data.items.length ? (soldItems.length / data.items.length) * 100 : 0;
  const avgMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    palletSpend,
    expenseSpend,
    totalInvested,
    revenue,
    cogs,
    grossProfit,
    netProfit,
    inventoryValue,
    sellThrough,
    avgMargin,
    soldCount: soldItems.length,
    inStockCount: inStockItems.length,
    itemCount: data.items.length,
  };
}

export function bestSources(data: LedgerData) {
  const { itemsByPallet, saleByItem, costByItem } = buildIndex(data);
  const bySrc = new Map<
    string,
    { source: string; spend: number; profit: number; palletCount: number; itemsSold: number }
  >();

  for (const p of data.pallets) {
    const key = p.source || "Unknown";
    const entry = bySrc.get(key) ?? { source: key, spend: 0, profit: 0, palletCount: 0, itemsSold: 0 };
    entry.spend += palletCostBasis(p);
    entry.palletCount += 1;
    for (const item of itemsByPallet.get(p.id) ?? []) {
      const sale = saleByItem.get(item.id);
      if (sale) {
        entry.profit += Number(sale.price || 0) - (costByItem.get(item.id) ?? 0);
        entry.itemsSold += 1;
      }
    }
    bySrc.set(key, entry);
  }

  return Array.from(bySrc.values()).sort((a, b) => b.profit - a.profit);
}

export function monthlyPL(data: LedgerData) {
  const { costByItem } = buildIndex(data);
  const byMonth = new Map<string, { key: string; revenue: number; cost: number; expenses: number }>();

  for (const s of data.sales) {
    const key = (s.sale_date || "").slice(0, 7);
    if (!key) continue;
    const cost = costByItem.get(s.item_id) ?? 0;
    const entry = byMonth.get(key) ?? { key, revenue: 0, cost: 0, expenses: 0 };
    entry.revenue += Number(s.price || 0);
    entry.cost += cost;
    byMonth.set(key, entry);
  }
  for (const e of data.expenses) {
    const key = (e.expense_date || "").slice(0, 7);
    if (!key) continue;
    const entry = byMonth.get(key) ?? { key, revenue: 0, cost: 0, expenses: 0 };
    entry.expenses += Number(e.amount || 0);
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.values())
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 6);
}

export function agingItems(data: LedgerData, minDays = 30) {
  const { palletsById } = buildIndex(data);
  return data.items
    .filter((i) => i.status !== "sold")
    .map((i) => {
      const pallet = palletsById.get(i.pallet_id);
      return { item: i, pallet, days: pallet ? daysSince(pallet.purchase_date) : 0 };
    })
    .filter((x) => x.days >= minDays)
    .sort((a, b) => b.days - a.days);
}

export function fmtMoney(n: number) {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v < 0 ? "-$" : "$") + s;
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtMonth(yyyyMm: string) {
  const d = new Date(yyyyMm + "-01T00:00:00");
  if (isNaN(d.getTime())) return yyyyMm;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function csvCell(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCSV(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
