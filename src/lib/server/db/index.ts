import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Instanciar la base de datos de SQLite
const sqlite = new Database('sqlite.db');

// Exportar la conexión de Drizzle
export const db = drizzle(sqlite, { schema });
