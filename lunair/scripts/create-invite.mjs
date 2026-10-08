// Erste Einladung anlegen, bevor es einen User gibt:
//   node --env-file=.env scripts/create-invite.mjs
// Danach können eingeloggte Leute unter /settings selbst einladen.
import { randomBytes } from "node:crypto";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL fehlt (node --env-file=.env scripts/create-invite.mjs)");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const code = randomBytes(9).toString("base64url");
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
await client.query("insert into invites (code, expires_at) values ($1, $2)", [code, expiresAt]);
await client.end();

const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
console.log(`Einladung (7 Tage gültig): ${base}/invite/${code}`);
