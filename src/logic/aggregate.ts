import { PeriodRange } from "./period";

export interface ExpenseRow {
  id: number;
  amount: number;
  category_id: number;
  payer_id: number;
  note?: string | null;
  created_at: string; // локальный ISO, см. toLocalIso
}

export interface NamedRef {
  id: number;
  name: string;
}

export function filterByPeriod(expenses: ExpenseRow[], range: PeriodRange): ExpenseRow[] {
  const startIso = isoBound(range.start);
  const endIso = isoBound(range.end);
  return expenses.filter((e) => e.created_at >= startIso && e.created_at < endIso);
}

function isoBound(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
}

export function filterByPayer(expenses: ExpenseRow[], payerId: number | null): ExpenseRow[] {
  if (payerId === null) return expenses;
  return expenses.filter((e) => e.payer_id === payerId);
}

export function sumTotal(expenses: ExpenseRow[]): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

export interface CategoryBreakdownItem {
  categoryId: number;
  name: string;
  total: number;
  count: number;
  percent: number; // 0-100
}

export function aggregateByCategory(
  expenses: ExpenseRow[],
  categories: NamedRef[]
): CategoryBreakdownItem[] {
  const total = sumTotal(expenses);
  const byId = new Map<number, { total: number; count: number }>();
  for (const e of expenses) {
    const cur = byId.get(e.category_id) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    byId.set(e.category_id, cur);
  }
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const result: CategoryBreakdownItem[] = [];
  for (const [categoryId, agg] of byId) {
    result.push({
      categoryId,
      name: nameById.get(categoryId) ?? "?",
      total: agg.total,
      count: agg.count,
      percent: total > 0 ? Math.round((agg.total / total) * 100) : 0,
    });
  }
  result.sort((a, b) => b.total - a.total);
  return result;
}

export interface PayerBreakdownItem {
  payerId: number;
  name: string;
  total: number;
}

export function aggregateByPayer(expenses: ExpenseRow[], payers: NamedRef[]): PayerBreakdownItem[] {
  const byId = new Map<number, number>();
  for (const e of expenses) {
    byId.set(e.payer_id, (byId.get(e.payer_id) ?? 0) + e.amount);
  }
  const nameById = new Map(payers.map((p) => [p.id, p.name]));
  const result: PayerBreakdownItem[] = [];
  for (const [payerId, total] of byId) {
    result.push({ payerId, name: nameById.get(payerId) ?? "?", total });
  }
  result.sort((a, b) => b.total - a.total);
  return result;
}

/** Сумма по дням (week/month) или по месяцам (year) — для простого графика. */
export function aggregateByBucket(
  expenses: ExpenseRow[],
  bucketStarts: Date[],
  kind: "day" | "month"
): number[] {
  const sums = new Array(bucketStarts.length).fill(0);
  for (const e of expenses) {
    const created = parseLocalIso(e.created_at);
    for (let i = bucketStarts.length - 1; i >= 0; i--) {
      const b = bucketStarts[i];
      const matches =
        kind === "day"
          ? created.getFullYear() === b.getFullYear() &&
            created.getMonth() === b.getMonth() &&
            created.getDate() === b.getDate()
          : created.getFullYear() === b.getFullYear() && created.getMonth() === b.getMonth();
      if (matches) {
        sums[i] += e.amount;
        break;
      }
    }
  }
  return sums;
}

function parseLocalIso(iso: string): Date {
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h = 0, mi = 0, s = 0] = (timePart ?? "0:0:0").split(":").map(Number);
  return new Date(y, m - 1, d, h, mi, s);
}
