import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// Ensure .data directory exists for persistent storage
const dataDir = path.join(process.cwd(), ".data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log("Created .data directory");
}

// Store database in .data directory for persistence
// Use absolute path to ensure consistency with drizzle.config.ts
const dbPath = path.join(dataDir, "database.db");
console.log("Database path:", dbPath);
console.log("Database exists:", existsSync(dbPath));

// Enable verbose mode and WAL mode for better concurrency
const sqlite = new Database(dbPath, { 
  verbose: (msg) => console.log("[SQLite]", msg),
  fileMustExist: false 
});

// Enable Write-Ahead Logging for better concurrency
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');

export const db = drizzle(sqlite, { schema });