"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { InvalidImageError, storeImage } from "@/lib/images";
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
