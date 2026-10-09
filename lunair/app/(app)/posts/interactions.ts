"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { isReaction, MAX_COMMENT } from "@/lib/reactions";
import { requireUser } from "@/lib/session";

const { postReactions, comments, posts } = schema;

async function postExists(postId: string) {
  const [row] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  return Boolean(row);
}

// ---------- Reaktionen ----------

/** Gleiche Reaktion nochmal = entfernen, andere = umstellen. */
export async function toggleReaction(postId: string, emoji: string) {
  const me = await requireUser();
  if (!isReaction(emoji) || !(await postExists(postId))) return;

  const where = and(eq(postReactions.postId, postId), eq(postReactions.userId, me.id));
  const [current] = await db.select({ emoji: postReactions.emoji }).from(postReactions).where(where).limit(1);

  if (current?.emoji === emoji) {
    await db.delete(postReactions).where(where);
  } else {
    await db
      .insert(postReactions)
      .values({ postId, userId: me.id, emoji })
      .onConflictDoUpdate({
        target: [postReactions.postId, postReactions.userId],
        set: { emoji, createdAt: new Date() },
      });
  }

  revalidatePath("/", "layout");
}

// ---------- Kommentare ----------

export type CommentState = { error?: string; body?: string; ok?: number } | undefined;

export async function addComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const me = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Der Kommentar ist leer." };
  if (body.length > MAX_COMMENT) return { error: `Zu lang (max. ${MAX_COMMENT} Zeichen).`, body };
  if (!(await postExists(postId))) return { error: "Den Beitrag gibt es nicht mehr." };

  await db.insert(comments).values({ id: randomUUID(), postId, authorId: me.id, body });

  revalidatePath("/", "layout");
  // ok wechselt bei jedem Erfolg, damit das Formular sich zuverlässig leert
  return { ok: Date.now() };
}

/** Löschen darf, wer den Kommentar geschrieben hat – oder wem der Beitrag gehört. */
export async function deleteComment(commentId: string) {
  const me = await requireUser();

  const [row] = await db
    .select({ authorId: comments.authorId, postAuthorId: posts.authorId })
    .from(comments)
    .innerJoin(posts, eq(posts.id, comments.postId))
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!row || (row.authorId !== me.id && row.postAuthorId !== me.id)) return;

  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath("/", "layout");
}
