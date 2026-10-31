import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";
import { seedIfEmpty } from "./seed";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync("expenses.db");
  await runMigrations(db);
  await seedIfEmpty(db);
  dbInstance = db;
  return db;
}
