import type { SQLiteDatabase } from "expo-sqlite";
import { ExpenseRow } from "../logic/aggregate";
import { toLocalIso } from "../logic/period";

export interface CategoryRow {
  id: number;
  name: string;
  sort_order: number;
  use_count: number;
  hidden: number;
}

export interface PayerRow {
  id: number;
  name: string;
  sort_order: number;
  hidden: number;
}

export async function listCategories(db: SQLiteDatabase, includeHidden = false): Promise<CategoryRow[]> {
  const sql = includeHidden
    ? "SELECT * FROM categories ORDER BY sort_order ASC"
    : "SELECT * FROM categories WHERE hidden = 0 ORDER BY sort_order ASC";
  return db.getAllAsync<CategoryRow>(sql);
}

// Для экрана ввода: частые плитки наверху, при равной частоте — вручную заданный порядок.
export async function listCategoriesByUsage(db: SQLiteDatabase): Promise<CategoryRow[]> {
  return db.getAllAsync<CategoryRow>(
    "SELECT * FROM categories WHERE hidden = 0 ORDER BY use_count DESC, sort_order ASC"
  );
}

export async function decrementCategoryUse(db: SQLiteDatabase, categoryId: number): Promise<void> {
  await db.runAsync(
    "UPDATE categories SET use_count = MAX(0, use_count - 1) WHERE id = ?",
    [categoryId]
  );
}

export async function listPayers(db: SQLiteDatabase, includeHidden = false): Promise<PayerRow[]> {
  const sql = includeHidden
    ? "SELECT * FROM payers ORDER BY sort_order ASC"
    : "SELECT * FROM payers WHERE hidden = 0 ORDER BY sort_order ASC";
  return db.getAllAsync<PayerRow>(sql);
}

export async function addExpense(
  db: SQLiteDatabase,
  params: { amount: number; categoryId: number; payerId: number; note?: string; createdAt?: Date }
): Promise<number> {
  const createdAt = toLocalIso(params.createdAt ?? new Date());
  const result = await db.runAsync(
    "INSERT INTO expenses (amount, category_id, payer_id, note, created_at) VALUES (?, ?, ?, ?, ?)",
    [params.amount, params.categoryId, params.payerId, params.note ?? null, createdAt]
  );
  // пригодится как счётчик частоты для сортировки плиток категорий
  await db.runAsync("UPDATE categories SET use_count = use_count + 1 WHERE id = ?", [params.categoryId]);
  return result.lastInsertRowId;
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  params: { amount: number; categoryId: number; payerId: number; note?: string; createdAt: Date }
): Promise<void> {
  await db.runAsync(
    "UPDATE expenses SET amount = ?, category_id = ?, payer_id = ?, note = ?, created_at = ? WHERE id = ?",
    [
      params.amount,
      params.categoryId,
      params.payerId,
      params.note ?? null,
      toLocalIso(params.createdAt),
      id,
    ]
  );
}

export async function listExpensesInRange(
  db: SQLiteDatabase,
  startIso: string,
  endIso: string
): Promise<ExpenseRow[]> {
  return db.getAllAsync<ExpenseRow>(
    "SELECT * FROM expenses WHERE created_at >= ? AND created_at < ? ORDER BY created_at DESC",
    [startIso, endIso]
  );
}

export async function listExpensesByDay(db: SQLiteDatabase): Promise<ExpenseRow[]> {
  return db.getAllAsync<ExpenseRow>("SELECT * FROM expenses ORDER BY created_at DESC");
}
