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

export async function listAllExpenses(db: SQLiteDatabase): Promise<ExpenseRow[]> {
  return db.getAllAsync<ExpenseRow>("SELECT * FROM expenses ORDER BY created_at DESC");
}

/* ---- справочники: настройки ---- */

export async function addCategory(db: SQLiteDatabase, name: string): Promise<void> {
  const row = await db.getFirstAsync<{ m: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) as m FROM categories"
  );
  await db.runAsync("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [
    name,
    (row?.m ?? -1) + 1,
  ]);
}

export async function renameCategory(db: SQLiteDatabase, id: number, name: string): Promise<void> {
  await db.runAsync("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
}

export async function setCategoryHidden(db: SQLiteDatabase, id: number, hidden: boolean): Promise<void> {
  await db.runAsync("UPDATE categories SET hidden = ? WHERE id = ?", [hidden ? 1 : 0, id]);
}

export async function swapCategoryOrder(db: SQLiteDatabase, idA: number, idB: number): Promise<void> {
  const rows = await db.getAllAsync<{ id: number; sort_order: number }>(
    "SELECT id, sort_order FROM categories WHERE id IN (?, ?)",
    [idA, idB]
  );
  if (rows.length !== 2) return;
  await db.runAsync("UPDATE categories SET sort_order = ? WHERE id = ?", [rows[1].sort_order, rows[0].id]);
  await db.runAsync("UPDATE categories SET sort_order = ? WHERE id = ?", [rows[0].sort_order, rows[1].id]);
}

export async function addPayer(db: SQLiteDatabase, name: string): Promise<void> {
  const row = await db.getFirstAsync<{ m: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) as m FROM payers"
  );
  await db.runAsync("INSERT INTO payers (name, sort_order) VALUES (?, ?)", [name, (row?.m ?? -1) + 1]);
}

export async function renamePayer(db: SQLiteDatabase, id: number, name: string): Promise<void> {
  await db.runAsync("UPDATE payers SET name = ? WHERE id = ?", [name, id]);
}

export async function setPayerHidden(db: SQLiteDatabase, id: number, hidden: boolean): Promise<void> {
  await db.runAsync("UPDATE payers SET hidden = ? WHERE id = ?", [hidden ? 1 : 0, id]);
}

export async function swapPayerOrder(db: SQLiteDatabase, idA: number, idB: number): Promise<void> {
  const rows = await db.getAllAsync<{ id: number; sort_order: number }>(
    "SELECT id, sort_order FROM payers WHERE id IN (?, ?)",
    [idA, idB]
  );
  if (rows.length !== 2) return;
  await db.runAsync("UPDATE payers SET sort_order = ? WHERE id = ?", [rows[1].sort_order, rows[0].id]);
  await db.runAsync("UPDATE payers SET sort_order = ? WHERE id = ?", [rows[0].sort_order, rows[1].id]);
}

/* ---- бэкап: экспорт / импорт ---- */

export interface BackupData {
  categories: CategoryRow[];
  payers: PayerRow[];
  expenses: ExpenseRow[];
}

export async function exportAllData(db: SQLiteDatabase): Promise<BackupData> {
  const [categories, payers, expenses] = await Promise.all([
    db.getAllAsync<CategoryRow>("SELECT * FROM categories ORDER BY sort_order"),
    db.getAllAsync<PayerRow>("SELECT * FROM payers ORDER BY sort_order"),
    db.getAllAsync<ExpenseRow>("SELECT * FROM expenses ORDER BY created_at"),
  ]);
  return { categories, payers, expenses };
}

// Полностью заменяет текущие данные содержимым бэкапа, сохраняя исходные id
// (на них ссылаются category_id/payer_id у трат).
export async function restoreAllData(db: SQLiteDatabase, data: BackupData): Promise<void> {
  await db.execAsync("DELETE FROM expenses; DELETE FROM categories; DELETE FROM payers;");
  for (const c of data.categories) {
    await db.runAsync(
      "INSERT INTO categories (id, name, sort_order, use_count, hidden) VALUES (?, ?, ?, ?, ?)",
      [c.id, c.name, c.sort_order, c.use_count, c.hidden]
    );
  }
  for (const p of data.payers) {
    await db.runAsync("INSERT INTO payers (id, name, sort_order, hidden) VALUES (?, ?, ?, ?)", [
      p.id,
      p.name,
      p.sort_order,
      p.hidden,
    ]);
  }
  for (const e of data.expenses) {
    await db.runAsync(
      "INSERT INTO expenses (id, amount, category_id, payer_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [e.id, e.amount, e.category_id, e.payer_id, e.note ?? null, e.created_at]
    );
  }
}
