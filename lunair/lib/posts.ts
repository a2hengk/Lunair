import { and, asc, count, desc, eq, inArray, lt, type SQL } from "drizzle-orm";
import { db, schema } from "./db";

export type FeedPost = {
  id: string;
  body: string | null;
  createdAt: Date;
  author: { id: string; name: string; username: string | null; image: string | null };
  media: { path: string; width: number; height: number }[];
};

const { posts, postMedia, user } = schema;

async function loadPosts(where: SQL | undefined, limit: number): Promise<FeedPost[]> {
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
  const media = ids.length
    ? await db
        .select({ postId: postMedia.postId, path: postMedia.path, width: postMedia.width, height: postMedia.height })
        .from(postMedia)
        .where(inArray(postMedia.postId, ids))
        .orderBy(asc(postMedia.position))
    : [];

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: { id: r.authorId, name: r.authorName, username: r.authorUsername, image: r.authorImage },
    media: media.filter((m) => m.postId === r.id).map(({ path, width, height }) => ({ path, width, height })),
  }));
}

export const FEED_PAGE_SIZE = 20;

/** Alle Beiträge der Gruppe, neueste zuerst. `before` = Zeitpunkt des letzten geladenen Beitrags. */
export function getFeed(before?: Date) {
  return loadPosts(before ? lt(posts.createdAt, before) : undefined, FEED_PAGE_SIZE);
}

export function getUserPosts(authorId: string) {
  return loadPosts(eq(posts.authorId, authorId), 90);
}

export async function countUserPosts(authorId: string) {
  const [row] = await db.select({ n: count() }).from(posts).where(eq(posts.authorId, authorId));
  return row?.n ?? 0;
}

export async function getPost(id: string) {
  const [post] = await loadPosts(and(eq(posts.id, id)), 1);
  return post;
}
