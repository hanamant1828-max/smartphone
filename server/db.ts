import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import { join } from "path";

const dbPath = join(process.cwd(), 'database', 'shop.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
