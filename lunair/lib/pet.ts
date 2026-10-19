import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "./db";

const { pet, petActions, user } = schema;

/** Es gibt genau ein Pet für alle. */
export const PET_ID = "lunair";
export const DEFAULT_PET_NAME = "Luni";

/** Nach so vielen Stunden ohne Futter ist es komplett hungrig (0 %). */
export const HUNGER_HOURS = 24;
/** Nach so vielen Stunden ohne Streicheln ist die Laune bei 0 %. */
export const LOVE_HOURS = 12;
/** Ab diesem Wert ist es zu satt bzw. zu zufrieden für mehr – verhindert Spam. */
export const FEED_BLOCK_FROM = 85;
export const PET_BLOCK_FROM = 90;

const HOUR = 60 * 60 * 1000;

/** Wie lange nach der letzten Aktion man nicht nochmal darf (abgeleitet aus den Grenzen oben). */
export const FEED_COOLDOWN_MS = ((100 - FEED_BLOCK_FROM) / 100) * HUNGER_HOURS * HOUR;
export const PET_COOLDOWN_MS = ((100 - PET_BLOCK_FROM) / 100) * LOVE_HOURS * HOUR;

export type PetMood = "happy" | "okay" | "hungry" | "lonely" | "sad";
export type PetActionType = "feed" | "pet";

const berlinDayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD in Berliner Zeit. */
export function berlinDay(date = new Date()) {
  return berlinDayFmt.format(date);
}

function dayBefore(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 100 direkt nach der Aktion, fällt linear auf 0. Nie passiert = 0. */
function level(last: Date | null, hours: number, now: Date) {
  if (!last) return 0;
  const elapsed = (now.getTime() - last.getTime()) / (hours * HOUR);
  return Math.round(Math.min(100, Math.max(0, 100 - elapsed * 100)));
}

/** Legt das Pet beim allerersten Aufruf an und gibt es zurück. */
export async function getPet() {
  const [row] = await db.select().from(pet).where(eq(pet.id, PET_ID)).limit(1);
  if (row) return row;

  await db.insert(pet).values({ id: PET_ID, name: DEFAULT_PET_NAME }).onConflictDoNothing();
  const [created] = await db.select().from(pet).where(eq(pet.id, PET_ID)).limit(1);
  return created;
}

export type PetRow = typeof pet.$inferSelect;

/** Alles, was die Oberfläche braucht – live aus den Zeitstempeln berechnet. */
export function petState(row: PetRow, now = new Date()) {
  const fullness = level(row.lastFedAt, HUNGER_HOURS, now);
  const love = level(row.lastPetAt, LOVE_HOURS, now);

  const today = berlinDay(now);
  const caredToday = row.lastStreakDay === today;
  // Gestern zuletzt versorgt = Streak lebt noch, heute muss aber jemand ran.
  const alive = caredToday || row.lastStreakDay === dayBefore(today);
  const streak = alive ? row.streak : 0;

  let mood: PetMood;
  if (fullness === 0 && love === 0) mood = "sad";
  else if (fullness < 30) mood = "hungry";
  else if (love < 30) mood = "lonely";
  else if (fullness >= 70 && love >= 70) mood = "happy";
  else mood = "okay";

  return {
    name: row.name,
    fullness,
    love,
    mood,
    streak,
    bestStreak: row.bestStreak,
    caredToday,
    canFeed: fullness < FEED_BLOCK_FROM,
    canPet: love < PET_BLOCK_FROM,
  };
}

export type PetState = ReturnType<typeof petState>;

/** Letzte Aktionen mit Person, neueste zuerst. */
export async function getRecentPetActions(limit = 8) {
  return db
    .select({
      id: petActions.id,
      type: petActions.type,
      createdAt: petActions.createdAt,
      userName: user.name,
      username: user.username,
      userImage: user.image,
      userId: user.id,
    })
    .from(petActions)
    .innerJoin(user, eq(user.id, petActions.userId))
    .where(eq(petActions.petId, PET_ID))
    .orderBy(desc(petActions.createdAt))
    .limit(limit);
}

/**
 * Füttern oder streicheln speichern. Alles in einem UPDATE, damit zwei Leute gleichzeitig
 * weder doppelt füttern noch die Streak doppelt hochzählen können.
 * false = noch zu satt/zufrieden (Cooldown läuft).
 */
export async function recordPetAction(userId: string, type: PetActionType) {
  await getPet();

  const lastCol = type === "feed" ? pet.lastFedAt : pet.lastPetAt;
  const cutoff = new Date(Date.now() - (type === "feed" ? FEED_COOLDOWN_MS : PET_COOLDOWN_MS));

  // „Heute“ rechnet die DB in Berliner Zeit – egal in welcher Zone der Server läuft.
  const today = sql`(now() AT TIME ZONE 'Europe/Berlin')::date`;
  const nextStreak = sql`CASE
    WHEN ${pet.lastStreakDay} = ${today} THEN ${pet.streak}
    WHEN ${pet.lastStreakDay} = ${today} - 1 THEN ${pet.streak} + 1
    ELSE 1
  END`;

  return db.transaction(async (tx) => {
    const rows = await tx
      .update(pet)
      .set({
        ...(type === "feed" ? { lastFedAt: sql`now()` } : { lastPetAt: sql`now()` }),
        streak: nextStreak,
        bestStreak: sql`GREATEST(${pet.bestStreak}, ${nextStreak})`,
        lastStreakDay: sql`${today}`,
      })
      .where(and(eq(pet.id, PET_ID), or(isNull(lastCol), lt(lastCol, cutoff))))
      .returning({ id: pet.id });

    if (rows.length === 0) return false;

    await tx.insert(petActions).values({ id: randomUUID(), petId: PET_ID, userId, type });
    return true;
  });
}
