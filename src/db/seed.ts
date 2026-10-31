export const INITIAL_CATEGORIES: string[] = [
  "Обед",
  "Кафе",
  "Продукты",
  "Такси",
  "Автобус",
  "Бензин",
  "Коммуналка",
  "Связь и подписки",
  "Аптека",
  "Одежда",
  "Развлечения",
  "Подарки",
  "Прочее",
];

export const INITIAL_PAYERS: string[] = ["Я", "Даша"];

export interface SeedExecutor {
  getFirstAsync<T>(sql: string): Promise<T | null>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
}

export async function seedIfEmpty(db: SeedExecutor): Promise<void> {
  const catRow = await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) as c FROM categories");
  if ((catRow?.c ?? 0) === 0) {
    for (let i = 0; i < INITIAL_CATEGORIES.length; i++) {
      await db.runAsync("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [
        INITIAL_CATEGORIES[i],
        i,
      ]);
    }
  }
  const payerRow = await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) as c FROM payers");
  if ((payerRow?.c ?? 0) === 0) {
    for (let i = 0; i < INITIAL_PAYERS.length; i++) {
      await db.runAsync("INSERT INTO payers (name, sort_order) VALUES (?, ?)", [
        INITIAL_PAYERS[i],
        i,
      ]);
    }
  }
}
