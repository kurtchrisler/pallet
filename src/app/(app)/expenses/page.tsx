import { getAppContext } from "@/lib/app-context";
import { submitExpense, deleteExpense } from "./actions";
import { fmtDate, fmtMoney } from "@/lib/calc";
import { EXPENSE_CATS, type Expense } from "@/lib/types";
import { Card, EmptyState, Field, SectionTitle, TableWrap } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { supabase } = await getAppContext();
  const { edit } = await searchParams;

  const { data: expenses } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
  const rows = (expenses ?? []) as Expense[];
  const editing = edit ? rows.find((e) => e.id === edit) : null;
  const total = rows.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <section>
      <h2 className="text-[1.05rem] font-display font-semibold">Expenses</h2>
      <p className="text-sm text-ink-soft mb-4">Everything besides lot cost — gas, storage, fees, supplies.</p>

      <Card>
        <form action={submitExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="Date">
            <input type="date" name="expense_date" defaultValue={editing?.expense_date ?? new Date().toISOString().slice(0, 10)} />
          </Field>
          <Field label="Category">
            <input name="category" list="expCatList" defaultValue={editing?.category ?? ""} placeholder="Category" />
            <datalist id="expCatList">
              {EXPENSE_CATS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Amount ($)">
            <input type="number" step="0.01" min="0" name="amount" required defaultValue={editing?.amount ?? ""} placeholder="0.00" />
          </Field>
          <Field label="Note" wide>
            <input name="note" defaultValue={editing?.note ?? ""} placeholder="Optional" />
          </Field>
          <div className="col-span-full flex gap-2 items-center mt-1">
            <button type="submit" className="bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2 text-sm shadow-sm hover:brightness-[1.08]">
              {editing ? "Save changes" : "Add expense"}
            </button>
            {editing && (
              <a href="/expenses" className="text-ink-soft text-sm px-3 py-2">
                Cancel
              </a>
            )}
          </div>
        </form>
      </Card>

      <SectionTitle title="Expense log" hint={`${rows.length} entries · ${fmtMoney(total)} total`} />
      {rows.length ? (
        <TableWrap>
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface-2 text-left text-[0.7rem] font-medium text-ink-soft">
                <th className="px-2.5 py-2">Date</th>
                <th className="px-2.5 py-2">Category</th>
                <th className="px-2.5 py-2">Note</th>
                <th className="px-2.5 py-2 text-right">Amount</th>
                <th className="px-2.5 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-2.5 py-2 mono">{fmtDate(e.expense_date)}</td>
                  <td className="px-2.5 py-2">{e.category}</td>
                  <td className="px-2.5 py-2">{e.note || "—"}</td>
                  <td className="px-2.5 py-2 text-right mono">{fmtMoney(e.amount)}</td>
                  <td className="px-2.5 py-2">
                    <div className="flex gap-1.5">
                      <a href={`/expenses?edit=${e.id}`} className="rounded-lg border border-line-strong px-2.5 py-1.5 text-[0.78rem] shadow-sm hover:border-ink-soft">
                        Edit
                      </a>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
                        <ConfirmDeleteButton confirmText="Delete this expense? This can't be undone." />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState>No expenses logged yet.</EmptyState>
      )}
    </section>
  );
}
