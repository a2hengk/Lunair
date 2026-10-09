import { asc, eq } from "drizzle-orm";
import { db, schema } from "./db";
import type { StickerInfo } from "./reactions";

export type GroupSticker = StickerInfo & { ownerId: string };

/** Alle Sticker der Gruppe – jeder darf jeden benutzen. */
export async function getAllStickers(): Promise<GroupSticker[]> {
  return db
    .select({
      id: schema.stickers.id,
      name: schema.stickers.name,
      path: schema.stickers.path,
      ownerId: schema.stickers.ownerId,
    })
    .from(schema.stickers)
    .orderBy(asc(schema.stickers.createdAt));
}

export async function getSticker(id: string) {
  const [row] = await db.select().from(schema.stickers).where(eq(schema.stickers.id, id)).limit(1);
  return row;
}
