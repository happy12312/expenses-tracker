import { runMigrations, latestVersion, MigrationExecutor } from "../src/db/migrations";
import { seedIfEmpty, INITIAL_CATEGORIES, INITIAL_PAYERS } from "../src/db/seed";

// Простейший in-memory мок, достаточный для миграций и сидирования,
// без реального SQLite-движка — ровно то, что допускает ТЗ.
class MockDb implements MigrationExecutor {
  version = 0;
  executed: string[] = [];
  tables: Record<string, any[]> = {};

  async execAsync(sql: string): Promise<void> {
    this.executed.push(sql);
    const versionMatch = sql.match(/PRAGMA user_version\s*=\s*(\d+)/i);
    if (versionMatch) {
      this.version = Number(versionMatch[1]);
      return;
    }
    const createMatch = sql.match(/CREATE TABLE (\w+)/i);
    if (createMatch) {
      this.tables[createMatch[1]] = [];
    }
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (/PRAGMA user_version/i.test(sql)) {
      return { user_version: this.version } as unknown as T;
    }
    return null;
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    const selectMatch = sql.match(/SELECT name FROM (\w+)/i);
    if (selectMatch) {
      const rows = this.tables[selectMatch[1]] ?? [];
      // params передавались как [name, sort_order]
      return rows.map((r: unknown[]) => ({ name: r[0] })) as unknown as T[];
    }
    return [];
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<unknown> {
    const insertMatch = sql.match(/INSERT INTO (\w+)/i);
    if (insertMatch) {
      const table = this.tables[insertMatch[1]] ?? (this.tables[insertMatch[1]] = []);
      table.push(params);
    }
    return { lastInsertRowId: 1 };
  }
}

describe("runMigrations", () => {
  it("применяет все миграции с нуля и доводит user_version до последней", async () => {
    const db = new MockDb();
    const finalVersion = await runMigrations(db);
    expect(finalVersion).toBe(latestVersion());
    expect(db.tables).toHaveProperty("categories");
    expect(db.tables).toHaveProperty("payers");
    expect(db.tables).toHaveProperty("expenses");
  });

  it("повторный запуск ничего не выполняет (идемпотентно)", async () => {
    const db = new MockDb();
    await runMigrations(db);
    const executedAfterFirst = db.executed.length;
    await runMigrations(db);
    expect(db.executed.length).toBe(executedAfterFirst);
  });
});

describe("seedIfEmpty", () => {
  it("заполняет справочники начальными значениями один раз", async () => {
    const db = new MockDb();
    await runMigrations(db);
    await seedIfEmpty(db);
    expect(db.tables.categories.length).toBe(INITIAL_CATEGORIES.length);
    expect(db.tables.payers.length).toBe(INITIAL_PAYERS.length);

    // повторный вызов не дублирует записи
    await seedIfEmpty(db);
    expect(db.tables.categories.length).toBe(INITIAL_CATEGORIES.length);
    expect(db.tables.payers.length).toBe(INITIAL_PAYERS.length);
  });
});
