"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { InvalidImageError, storeImage, type StoredImage } from "@/lib/images";
import { MAX_BODY, MAX_PHOTOS } from "@/lib/post-limits";
import { requireUser } from "@/lib/session";
import { deleteMedia, StorageNotConfiguredError } from "@/lib/storage";

export type ComposeState = { error?: string; body?: string } | undefined;

export async function createPost(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  const me = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!body && files.length === 0) return { error: "Schreib etwas oder wähl ein Foto aus." };
  if (body.length > MAX_BODY) return { error: `Der Text ist zu lang (max. ${MAX_BODY} Zeichen).`, body };
  if (files.length > MAX_PHOTOS) return { error: `Höchstens ${MAX_PHOTOS} Fotos pro Beitrag.`, body };

  // Erst alle Bilder speichern; geht eins schief, die schon gespeicherten wieder löschen.
  const stored: StoredImage[] = [];
  try {
    for (const file of files) stored.push(await storeImage(file, "posts", me.id));
  } catch (err) {
    await deleteMedia(stored.map((s) => s.path));
    if (err instanceof InvalidImageError) return { error: err.message, body };
    if (err instanceof StorageNotConfiguredError) {
      return { error: "Fotos gehen gerade noch nicht – der Bilder-Speicher ist nicht eingerichtet. Text geht.", body };
    }
    throw err;
  }

  const postId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(schema.posts).values({ id: postId, authorId: me.id, body: body || null });
    if (stored.length) {
      await tx.insert(schema.postMedia).values(
        stored.map((s, position) => ({ id: randomUUID(), postId, position, ...s })),
      );
    }
  });

  revalidatePath("/", "layout");
  redirect("/");
}

export async function deletePost(postId: string) {
  const me = await requireUser();

  const media = await db
    .select({ path: schema.postMedia.path })
    .from(schema.postMedia)
    .innerJoin(schema.posts, eq(schema.posts.id, schema.postMedia.postId))
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.authorId, me.id)));

  const deleted = await db
    .delete(schema.posts)
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.authorId, me.id)))
    .returning({ id: schema.posts.id });

  if (deleted.length) await deleteMedia(media.map((m) => m.path));

  revalidatePath("/", "layout");
  redirect(`/u/${me.username}`);
}
