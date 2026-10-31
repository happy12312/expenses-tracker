import type { SQLiteDatabase } from "expo-sqlite";
import { addExpense, listCategories, listPayers } from "./queries";

// Только для разработки: наполняет пустую базу правдоподобной историей трат,
// чтобы Сводки и Историю можно было проверить на реальных данных в Expo Go.
// В финальной сборке __DEV__ === false, этот код не выполняется.
const AMOUNT_RANGES: Record<string, [number, number]> = {
  "Обед": [500, 2500],
  "Кафе": [1500, 6000],
  "Продукты": [2000, 15000],
  "Такси": [500, 3500],
  "Автобус": [80, 200],
  "Бензин": [5000, 15000],
  "Коммуналка": [8000, 25000],
  "Связь и подписки": [1000, 5000],
  "Аптека": [500, 8000],
  "Одежда": [3000, 30000],
  "Развлечения": [1000, 10000],
  "Подарки": [2000, 20000],
  "Прочее": [200, 5000],
};

const SAMPLE_NOTES = ["с коллегами", "срочно понадобилось", "на районе", "давно хотел", ""];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(categoryName: string): number {
  const range = AMOUNT_RANGES[categoryName] ?? [200, 5000];
  return Math.round(randomInt(range[0], range[1]) / 10) * 10;
}

export async function seedSampleExpensesIfEmpty(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) as c FROM expenses");
  if ((existing?.c ?? 0) > 0) return;

  const categories = await listCategories(db);
  const payers = await listPayers(db);
  if (categories.length === 0 || payers.length === 0) return;

  const DAYS_BACK = 50;
  const now = new Date();

  for (let dayOffset = DAYS_BACK; dayOffset >= 0; dayOffset--) {
    const entriesToday = Math.random() < 0.25 ? 0 : randomInt(1, 3);
    for (let i = 0; i < entriesToday; i++) {
      const category = categories[randomInt(0, categories.length - 1)];
      const payer = Math.random() < 0.7 ? payers[0] : payers[randomInt(0, payers.length - 1)];
      const hour = randomInt(8, 22);
      const minute = randomInt(0, 59);
      const createdAt = new Date(now);
      createdAt.setDate(now.getDate() - dayOffset);
      createdAt.setHours(hour, minute, 0, 0);

      const note = SAMPLE_NOTES[randomInt(0, SAMPLE_NOTES.length - 1)];

      await addExpense(db, {
        amount: randomAmount(category.name),
        categoryId: category.id,
        payerId: payer.id,
        note: note || undefined,
        createdAt,
      });
    }
  }
}
