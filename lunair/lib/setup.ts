import { db, schema } from "./db";

/** Fester Code: wer ihn als Erster einträgt, darf den ersten Account anlegen – danach nie wieder. */
export const SETUP_CODE = "__setup__";

export async function hasAnyUser() {
  const [row] = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
  return Boolean(row);
}
