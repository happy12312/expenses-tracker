// Абстракция над тем подмножеством API expo-sqlite, которое нужно миграциям.
// Та же сигнатура, что у реального SQLiteDatabase — поэтому в тестах можно
// подставить лёгкий мок без установки нативного модуля.
export interface MigrationExecutor {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}

interface Migration {
  version: number;
  up: string[];
}

const migrations: Migration[] = [
  {
    version: 1,
    up: [
      `CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        use_count INTEGER NOT NULL DEFAULT 0,
        hidden INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE payers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        hidden INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount INTEGER NOT NULL CHECK (amount > 0),
        category_id INTEGER NOT NULL REFERENCES categories(id),
        payer_id INTEGER NOT NULL REFERENCES payers(id),
        note TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX idx_expenses_created ON expenses(created_at)`,
    ],
  },
];

export async function runMigrations(db: MigrationExecutor): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let current = row?.user_version ?? 0;
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  for (const m of sorted) {
    if (m.version > current) {
      for (const stmt of m.up) {
        await db.execAsync(stmt);
      }
      await db.execAsync(`PRAGMA user_version = ${m.version}`);
      current = m.version;
    }
  }
  return current;
}

export function latestVersion(): number {
  return migrations.reduce((max, m) => Math.max(max, m.version), 0);
}
