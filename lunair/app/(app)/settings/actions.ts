"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { InvalidImageError, storeImage } from "@/lib/images";
import { MAX_STICKER_NAME, MAX_STICKERS_PER_PERSON } from "@/lib/reactions";
import { requireUser } from "@/lib/session";
import { deleteMedia, StorageNotConfiguredError } from "@/lib/storage";

export type ProfileState = { error?: string; saved?: boolean } | undefined;

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name darf nicht leer sein.").max(40, "Name ist zu lang (max. 40 Zeichen)."),
  bio: z.string().trim().max(160, "Bio ist zu lang (max. 160 Zeichen)."),
});

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db
    .update(schema.user)
    .set({ name: parsed.data.name, bio: parsed.data.bio || null, updatedAt: new Date() })
    .where(eq(schema.user.id, me.id));

  revalidatePath("/", "layout");
  return { saved: true };
}

const INVITE_DAYS = 7;

export async function createInvite() {
  const me = await requireUser();
  await db.insert(schema.invites).values({
    code: randomBytes(9).toString("base64url"),
    createdBy: me.id,
    expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
  });
  revalidatePath("/settings");
}

// ---------- Profilbild & Banner ----------

export type AvatarState = { error?: string } | undefined;

const IMAGE_FIELDS = {
  avatars: { form: "avatar", column: "image" },
  banners: { form: "banner", column: "bannerImage" },
} as const;

async function replaceImage(kind: keyof typeof IMAGE_FIELDS, formData: FormData): Promise<AvatarState> {
  const me = await requireUser();
  const { form, column } = IMAGE_FIELDS[kind];
  const file = formData.get(form);
  if (!(file instanceof File)) return { error: "Kein Bild ausgewählt." };

  let path: string;
  try {
    ({ path } = await storeImage(file, kind, me.id));
  } catch (err) {
    if (err instanceof InvalidImageError) return { error: err.message };
    if (err instanceof StorageNotConfiguredError) return { error: "Bilder-Upload ist noch nicht eingerichtet." };
    throw err;
  }

  await db.update(schema.user).set({ [column]: path, updatedAt: new Date() }).where(eq(schema.user.id, me.id));
  const old = me[column];
  if (old) await deleteMedia([old]);

  revalidatePath("/", "layout");
  return undefined;
}

async function clearImage(kind: keyof typeof IMAGE_FIELDS) {
  const me = await requireUser();
  const { column } = IMAGE_FIELDS[kind];
  const old = me[column];
  if (!old) return;
  await db.update(schema.user).set({ [column]: null, updatedAt: new Date() }).where(eq(schema.user.id, me.id));
  await deleteMedia([old]);
  revalidatePath("/", "layout");
}

export async function updateAvatar(_prev: AvatarState, formData: FormData) {
  return replaceImage("avatars", formData);
}

export async function removeAvatar() {
  return clearImage("avatars");
}

export async function updateBanner(_prev: AvatarState, formData: FormData) {
  return replaceImage("banners", formData);
}

export async function removeBanner() {
  return clearImage("banners");
}

// ---------- Sticker ----------

export type StickerState = { error?: string; ok?: number } | undefined;

export async function createSticker(_prev: StickerState, formData: FormData): Promise<StickerState> {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("sticker");

  if (!name) return { error: "Gib dem Sticker einen Namen." };
  if (name.length > MAX_STICKER_NAME) return { error: `Name zu lang (max. ${MAX_STICKER_NAME} Zeichen).` };
  if (!(file instanceof File)) return { error: "Kein Bild ausgewählt." };

  const [{ n }] = await db.select({ n: count() }).from(schema.stickers).where(eq(schema.stickers.ownerId, me.id));
  if (n >= MAX_STICKERS_PER_PERSON) {
    return { error: `Du hast schon ${MAX_STICKERS_PER_PERSON} Sticker. Lösch erst einen.` };
  }

  let stored: { path: string; width: number; height: number };
  try {
    stored = await storeImage(file, "stickers", me.id);
  } catch (err) {
    if (err instanceof InvalidImageError) return { error: err.message };
    if (err instanceof StorageNotConfiguredError) return { error: "Bilder-Upload ist noch nicht eingerichtet." };
    throw err;
  }
  // Format festnageln: Sticker sind immer quadratisch und klein
  if (stored.width !== stored.height || stored.width > 512) {
    await deleteMedia([stored.path]);
    return { error: "Sticker müssen quadratisch und höchstens 512 px groß sein." };
  }

  await db.insert(schema.stickers).values({ id: randomUUID(), ownerId: me.id, name, path: stored.path });
  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

/** Nur eigene Sticker. Reaktionen damit verschwinden, Kommentare zeigen „Sticker entfernt“. */
export async function deleteSticker(stickerId: string) {
  const me = await requireUser();
  const [deleted] = await db
    .delete(schema.stickers)
    .where(and(eq(schema.stickers.id, stickerId), eq(schema.stickers.ownerId, me.id)))
    .returning({ path: schema.stickers.path });
  if (deleted) await deleteMedia([deleted.path]);
  revalidatePath("/", "layout");
}
