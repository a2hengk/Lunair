"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth, USERNAME_PATTERN } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export type FormState = { error?: string; values?: Record<string, string> } | undefined;

/** Eingaben (ohne Passwort) zurückgeben, damit React 19 das Formular nach einem Fehler nicht leert. */
function keep(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (key !== "password" && !key.startsWith("$") && typeof value === "string") values[key] = value;
  }
  return values;
}

// ---------- Login ----------

const loginSchema = z.object({
  username: z.string().trim().min(1, "Benutzername fehlt."),
  password: z.string().min(1, "Passwort fehlt."),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: keep(formData) };

  try {
    await auth.api.signInUsername({
      body: { username: parsed.data.username, password: parsed.data.password },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) {
      return { error: "Benutzername oder Passwort stimmt nicht.", values: keep(formData) };
    }
    throw err;
  }

  redirect("/");
}

// ---------- Registrierung mit Einladung ----------

const signUpSchema = z.object({
  code: z.string().min(1),
  name: z.string().trim().min(1, "Wie sollen dich die anderen sehen?").max(40, "Name ist zu lang (max. 40 Zeichen)."),
  username: z
    .string()
    .trim()
    .regex(USERNAME_PATTERN, "Benutzername: 3–24 Zeichen, nur Buchstaben, Zahlen, Punkt und Unterstrich."),
  email: z.email("Das ist keine gültige E-Mail-Adresse."),
  password: z.string().min(8, "Passwort braucht mindestens 8 Zeichen.").max(128),
});

export async function signUpWithInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: keep(formData) };
  const { code, name, username, email, password } = parsed.data;

  // Code atomar reservieren, damit ihn nicht zwei Leute gleichzeitig einlösen.
  const now = new Date();
  const [claimed] = await db
    .update(schema.invites)
    .set({ claimedAt: now })
    .where(
      and(
        eq(schema.invites.code, code),
        isNull(schema.invites.usedBy),
        isNull(schema.invites.claimedAt),
        or(isNull(schema.invites.expiresAt), gt(schema.invites.expiresAt, now)),
      ),
    )
    .returning();

  if (!claimed) {
    return { error: "Diese Einladung gilt nicht mehr. Frag nach einem neuen Link." };
  }

  let userId: string;
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password, username },
      headers: await headers(),
    });
    userId = result.user.id;
  } catch (err) {
    // Reservierung zurückgeben, damit der Link weiter funktioniert.
    await db.update(schema.invites).set({ claimedAt: null }).where(eq(schema.invites.code, code));
    if (err instanceof APIError) return { error: signUpErrorMessage(err), values: keep(formData) };
    throw err;
  }

  await db
    .update(schema.invites)
    .set({ usedBy: userId, usedAt: new Date() })
    .where(eq(schema.invites.code, code));

  redirect("/");
}

function signUpErrorMessage(err: APIError): string {
  const code = (err.body as { code?: string } | undefined)?.code ?? "";
  if (code.includes("USERNAME")) return "Der Benutzername ist schon vergeben.";
  if (code.includes("USER_ALREADY_EXISTS")) return "Mit dieser E-Mail gibt es schon einen Account.";
  if (code.includes("PASSWORD")) return "Das Passwort ist zu kurz oder zu lang.";
  return "Das hat nicht geklappt. Prüf deine Angaben und versuch es nochmal.";
}

// ---------- Logout ----------

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
