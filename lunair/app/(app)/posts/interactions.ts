"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { MAX_COMMENT, MAX_REACTIONS_PER_PERSON, parseReactionKey } from "@/lib/reactions";
import { requireUser } from "@/lib/session";
import { getSticker } from "@/lib/stickers";

const { postReactions, commentReactions, comments, posts } = schema;

export type ReactionTarget = { kind: "post" | "comment"; id: string };
export type ReactionResult = { error?: string };

async function targetExists({ kind, id }: ReactionTarget) {
  const table = kind === "post" ? posts : comments;
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1);
  return Boolean(row);
}

// ---------- Reaktionen (Beiträge und Kommentare) ----------

/** Antippen = setzen, nochmal antippen = wegnehmen. Bis zu 3 verschiedene pro Person. */
export async function toggleReaction(target: ReactionTarget, key: string): Promise<ReactionResult> {
  const me = await requireUser();
  const parsed = parseReactionKey(key);
  if (!parsed || !(await targetExists(target))) return { error: "Das ging nicht." };

  let stickerId: string | null = null;
  if ("stickerId" in parsed) {
    if (!(await getSticker(parsed.stickerId))) return { error: "Den Sticker gibt es nicht mehr." };
    stickerId = parsed.stickerId;
  }

  const t = target.kind === "post" ? postReactions : commentReactions;
  const targetCol = target.kind === "post" ? postReactions.postId : commentReactions.commentId;
  const mine = and(eq(targetCol, target.id), eq(t.userId, me.id));

  const result = await db.transaction(async (tx) => {
    const existing = await tx.select({ key: t.emoji }).from(t).where(and(mine, eq(t.emoji, key))).limit(1);
    if (existing.length) {
      await tx.delete(t).where(and(mine, eq(t.emoji, key)));
      return {};
    }
    const [{ n }] = await tx.select({ n: count() }).from(t).where(mine);
    if (n >= MAX_REACTIONS_PER_PERSON) {
      return { error: `Höchstens ${MAX_REACTIONS_PER_PERSON} Reaktionen – nimm erst eine weg.` };
    }
    const values = { userId: me.id, emoji: key, stickerId };
    if (target.kind === "post") {
      await tx.insert(postReactions).values({ ...values, postId: target.id }).onConflictDoNothing();
    } else {
      await tx.insert(commentReactions).values({ ...values, commentId: target.id }).onConflictDoNothing();
    }
    return {};
  });

  revalidatePath("/", "layout");
  return result;
}

// ---------- Kommentare & Antworten ----------

export type CommentState = { error?: string; ok?: number } | undefined;

export async function addComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const me = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const replyTo = String(formData.get("replyTo") ?? "") || null;
  const stickerId = String(formData.get("stickerId") ?? "") || null;

  if (!body && !stickerId) return { error: "Der Kommentar ist leer." };
  if (body.length > MAX_COMMENT) return { error: `Zu lang (max. ${MAX_COMMENT} Zeichen).` };

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return { error: "Den Beitrag gibt es nicht mehr." };

  if (stickerId && !(await getSticker(stickerId))) return { error: "Den Sticker gibt es nicht mehr." };

  // Antworten hängen immer am obersten Kommentar (eine Ebene)
  let parentId: string | null = null;
  if (replyTo) {
    const [target] = await db
      .select({ id: comments.id, parentId: comments.parentId, postId: comments.postId })
      .from(comments)
      .where(eq(comments.id, replyTo))
      .limit(1);
    if (!target || target.postId !== postId) return { error: "Der Kommentar, auf den du antwortest, ist weg." };
    parentId = target.parentId ?? target.id;
  }

  await db.insert(comments).values({
    id: randomUUID(),
    postId,
    authorId: me.id,
    parentId,
    body: body || null,
    stickerId,
  });

  revalidatePath("/", "layout");
  return { ok: Date.now() };
}

/** Löschen darf, wer den Kommentar geschrieben hat – oder wem der Beitrag gehört. Antworten gehen mit. */
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
