import { and, asc, count, desc, eq, inArray, lt, type SQL } from "drizzle-orm";
import { db, schema } from "./db";
import { sortReactions, type ReactionSummary, type StickerInfo } from "./reactions";

export type { ReactionSummary } from "./reactions";

type Author = { id: string; name: string; username: string | null; image: string | null };

export type FeedPost = {
  id: string;
  body: string | null;
  createdAt: Date;
  author: Author;
  media: { path: string; width: number; height: number }[];
  reactions: ReactionSummary[];
  myReactions: string[];
  commentCount: number;
};

const { posts, postMedia, postReactions, commentReactions, comments, stickers, user } = schema;

type ReactionRow = { targetId: string; key: string; n: number; sId: string | null; sName: string | null; sPath: string | null };

function summarize(rows: ReactionRow[], targetId: string): ReactionSummary[] {
  return sortReactions(
    rows
      .filter((r) => r.targetId === targetId)
      .map((r) => ({
        key: r.key,
        count: r.n,
        sticker: r.sId && r.sName && r.sPath ? ({ id: r.sId, name: r.sName, path: r.sPath } satisfies StickerInfo) : null,
      })),
  );
}

/** Reaktionen (gezählt, mit Sticker-Infos) + die eigenen Schlüssel für eine Menge Beiträge. */
async function postReactionData(ids: string[], viewerId: string) {
  const [counts, mine] = await Promise.all([
    db
      .select({
        targetId: postReactions.postId,
        key: postReactions.emoji,
        n: count(),
        sId: stickers.id,
        sName: stickers.name,
        sPath: stickers.path,
      })
      .from(postReactions)
      .leftJoin(stickers, eq(stickers.id, postReactions.stickerId))
      .where(inArray(postReactions.postId, ids))
      .groupBy(postReactions.postId, postReactions.emoji, stickers.id),
    db
      .select({ targetId: postReactions.postId, key: postReactions.emoji })
      .from(postReactions)
      .where(and(inArray(postReactions.postId, ids), eq(postReactions.userId, viewerId)))
      .orderBy(asc(postReactions.createdAt)),
  ]);
  return { counts, mine };
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

  const [media, reactions, commentCounts] = await Promise.all([
    db
      .select({ postId: postMedia.postId, path: postMedia.path, width: postMedia.width, height: postMedia.height })
      .from(postMedia)
      .where(inArray(postMedia.postId, ids))
      .orderBy(asc(postMedia.position)),
    postReactionData(ids, viewerId),
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
    reactions: summarize(reactions.counts, r.id),
    myReactions: reactions.mine.filter((x) => x.targetId === r.id).map((x) => x.key),
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

// ---------- Kommentare ----------

export type PostComment = {
  id: string;
  parentId: string | null;
  body: string | null;
  sticker: StickerInfo | null;
  /** Kommentar hatte einen Sticker, der inzwischen gelöscht wurde */
  stickerRemoved: boolean;
  createdAt: Date;
  author: Author;
  reactions: ReactionSummary[];
  myReactions: string[];
  replies: PostComment[];
};

/** Kommentare als Baum: oberste Ebene chronologisch, Antworten darunter. */
export async function getComments(postId: string, viewerId: string): Promise<PostComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      body: comments.body,
      createdAt: comments.createdAt,
      sId: stickers.id,
      sName: stickers.name,
      sPath: stickers.path,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorImage: user.image,
    })
    .from(comments)
    .innerJoin(user, eq(user.id, comments.authorId))
    .leftJoin(stickers, eq(stickers.id, comments.stickerId))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt), asc(comments.id));

  const ids = rows.map((r) => r.id);
  const [counts, mine] = ids.length
    ? await Promise.all([
        db
          .select({
            targetId: commentReactions.commentId,
            key: commentReactions.emoji,
            n: count(),
            sId: stickers.id,
            sName: stickers.name,
            sPath: stickers.path,
          })
          .from(commentReactions)
          .leftJoin(stickers, eq(stickers.id, commentReactions.stickerId))
          .where(inArray(commentReactions.commentId, ids))
          .groupBy(commentReactions.commentId, commentReactions.emoji, stickers.id),
        db
          .select({ targetId: commentReactions.commentId, key: commentReactions.emoji })
          .from(commentReactions)
          .where(and(inArray(commentReactions.commentId, ids), eq(commentReactions.userId, viewerId))),
      ])
    : [[], []];

  const all: PostComment[] = rows.map((r) => ({
    id: r.id,
    parentId: r.parentId,
    body: r.body,
    sticker: r.sId && r.sName && r.sPath ? { id: r.sId, name: r.sName, path: r.sPath } : null,
    stickerRemoved: !r.sId && !r.body,
    createdAt: r.createdAt,
    author: { id: r.authorId, name: r.authorName, username: r.authorUsername, image: r.authorImage },
    reactions: summarize(counts, r.id),
    myReactions: mine.filter((x) => x.targetId === r.id).map((x) => x.key),
    replies: [],
  }));

  const byId = new Map(all.map((c) => [c.id, c]));
  const top: PostComment[] = [];
  for (const c of all) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    if (parent) parent.replies.push(c);
    else top.push(c);
  }
  return top;
}

/** Wer hat wie reagiert – für die Einzelansicht. */
export async function getReactors(postId: string) {
  const rows = await db
    .select({
      key: postReactions.emoji,
      name: user.name,
      username: user.username,
      sId: stickers.id,
      sName: stickers.name,
      sPath: stickers.path,
    })
    .from(postReactions)
    .innerJoin(user, eq(user.id, postReactions.userId))
    .leftJoin(stickers, eq(stickers.id, postReactions.stickerId))
    .where(eq(postReactions.postId, postId))
    .orderBy(asc(postReactions.createdAt));

  const byKey = new Map<string, { sticker: StickerInfo | null; people: { name: string; username: string | null }[] }>();
  for (const r of rows) {
    const entry = byKey.get(r.key) ?? {
      sticker: r.sId && r.sName && r.sPath ? { id: r.sId, name: r.sName, path: r.sPath } : null,
      people: [],
    };
    entry.people.push({ name: r.name, username: r.username });
    byKey.set(r.key, entry);
  }
  return sortReactions([...byKey].map(([key, e]) => ({ key, count: e.people.length, ...e })));
}
