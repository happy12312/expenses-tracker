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
  getAllAsync<T>(sql: string): Promise<T[]>;
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
}

// Проверяем и добавляем каждое значение по отдельности (а не "если таблица
// пуста, вставить всё") — так заполнение само чинит себя, если прошлый запуск
// прервался (крэш, перезапуск) на середине вставки.
export async function seedIfEmpty(db: SeedExecutor): Promise<void> {
  const existingCats = await db.getAllAsync<{ name: string }>("SELECT name FROM categories");
  const existingCatNames = new Set(existingCats.map((c) => c.name));
  let nextCatOrder = existingCats.length;
  for (const name of INITIAL_CATEGORIES) {
    if (!existingCatNames.has(name)) {
      await db.runAsync("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [
        name,
        nextCatOrder++,
      ]);
    }
  }

  const existingPayers = await db.getAllAsync<{ name: string }>("SELECT name FROM payers");
  const existingPayerNames = new Set(existingPayers.map((p) => p.name));
  let nextPayerOrder = existingPayers.length;
  for (const name of INITIAL_PAYERS) {
    if (!existingPayerNames.has(name)) {
      await db.runAsync("INSERT INTO payers (name, sort_order) VALUES (?, ?)", [
        name,
        nextPayerOrder++,
      ]);
    }
  }
}
