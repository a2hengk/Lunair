import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db, schema } from "./db";

/** Session einmal pro Request laden (React cache). */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Eingeloggten User aus der DB holen oder zum Login schicken. */
export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  const [me] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);
  if (!me) redirect("/login");

  return me;
});
