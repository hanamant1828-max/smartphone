import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// Ensure .data directory exists for persistent storage
const dataDir = path.join(process.cwd(), ".data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Store database in .data directory for persistence
const dbPath = path.join(dataDir, "database.db");
console.log("Database path:", dbPath);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });