import { and, asc, count, desc, eq, inArray, lt, type SQL } from "drizzle-orm";
import { db, schema } from "./db";
import { REACTIONS } from "./reactions";

export type ReactionSummary = { emoji: string; count: number };

export type FeedPost = {
  id: string;
  body: string | null;
  createdAt: Date;
  author: { id: string; name: string; username: string | null; image: string | null };
  media: { path: string; width: number; height: number }[];
  reactions: ReactionSummary[];
  myReaction: string | null;
  commentCount: number;
};

const { posts, postMedia, postReactions, comments, user } = schema;

function sortReactions(list: ReactionSummary[]) {
  const order = (e: string) => {
    const i = (REACTIONS as readonly string[]).indexOf(e);
    return i === -1 ? 99 : i;
  };
  return list.sort((a, b) => b.count - a.count || order(a.emoji) - order(b.emoji));
}

async function loadPosts(where: SQL | undefined, limit: number, viewerId: string): Promise<FeedPost[]> {
  const rows = await db
    .select({
      id: posts.id,
      body: posts.body,
      createdAt: posts.createdAt,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorImage: user.image,
    })
    .from(posts)
    .innerJoin(user, eq(user.id, posts.authorId))
    .where(where)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  const [media, reactionCounts, mine, commentCounts] = await Promise.all([
    db
      .select({ postId: postMedia.postId, path: postMedia.path, width: postMedia.width, height: postMedia.height })
      .from(postMedia)
      .where(inArray(postMedia.postId, ids))
      .orderBy(asc(postMedia.position)),
    db
      .select({ postId: postReactions.postId, emoji: postReactions.emoji, n: count() })
      .from(postReactions)
      .where(inArray(postReactions.postId, ids))
      .groupBy(postReactions.postId, postReactions.emoji),
    db
      .select({ postId: postReactions.postId, emoji: postReactions.emoji })
      .from(postReactions)
      .where(and(inArray(postReactions.postId, ids), eq(postReactions.userId, viewerId))),
    db
      .select({ postId: comments.postId, n: count() })
      .from(comments)
      .where(inArray(comments.postId, ids))
      .groupBy(comments.postId),
  ]);

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: { id: r.authorId, name: r.authorName, username: r.authorUsername, image: r.authorImage },
    media: media.filter((m) => m.postId === r.id).map(({ path, width, height }) => ({ path, width, height })),
    reactions: sortReactions(
      reactionCounts.filter((x) => x.postId === r.id).map(({ emoji, n }) => ({ emoji, count: n })),
    ),
    myReaction: mine.find((x) => x.postId === r.id)?.emoji ?? null,
    commentCount: commentCounts.find((x) => x.postId === r.id)?.n ?? 0,
  }));
}

export const FEED_PAGE_SIZE = 20;

/** Alle Beiträge der Gruppe, neueste zuerst. `before` = Zeitpunkt des letzten geladenen Beitrags. */
export function getFeed(viewerId: string, before?: Date) {
  return loadPosts(before ? lt(posts.createdAt, before) : undefined, FEED_PAGE_SIZE, viewerId);
}

export function getUserPosts(authorId: string, viewerId: string) {
  return loadPosts(eq(posts.authorId, authorId), 90, viewerId);
}

export async function countUserPosts(authorId: string) {
  const [row] = await db.select({ n: count() }).from(posts).where(eq(posts.authorId, authorId));
  return row?.n ?? 0;
}

export async function getPost(id: string, viewerId: string) {
  const [post] = await loadPosts(eq(posts.id, id), 1, viewerId);
  return post;
}

export type PostComment = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; username: string | null; image: string | null };
};

export async function getComments(postId: string): Promise<PostComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorImage: user.image,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.authorId))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt), asc(comments.id));

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: { id: r.authorId, name: r.authorName, username: r.authorUsername, image: r.authorImage },
  }));
}

/** Wer hat wie reagiert – für die Einzelansicht. */
export async function getReactors(postId: string) {
  const rows = await db
    .select({ emoji: postReactions.emoji, name: user.name, username: user.username })
    .from(postReactions)
    .innerJoin(user, eq(user.id, postReactions.userId))
    .where(eq(postReactions.postId, postId))
    .orderBy(asc(postReactions.createdAt));

  const byEmoji = new Map<string, { name: string; username: string | null }[]>();
  for (const r of rows) {
    const list = byEmoji.get(r.emoji) ?? [];
    list.push({ name: r.name, username: r.username });
    byEmoji.set(r.emoji, list);
  }
  return sortReactions([...byEmoji].map(([emoji, people]) => ({ emoji, count: people.length }))).map((s) => ({
    emoji: s.emoji,
    people: byEmoji.get(s.emoji)!,
  }));
}
