// Läuft vor jedem Build (npm run build). Spielt neue Migrationen aus ./drizzle ein.
// Ohne DATABASE_URL wird übersprungen, damit der Build trotzdem durchläuft.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL fehlt – Migration übersprungen.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("[migrate] Datenbank ist auf dem neuesten Stand.");
} finally {
  await pool.end();
}
