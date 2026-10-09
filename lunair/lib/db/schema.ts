import { type AnyPgColumn, boolean, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

// --- Better Auth Tabellen (Namen/Spalten müssen zum Better-Auth-Schema passen) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Anzeigename
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  username: text("username").unique(), // username-Plugin, immer lowercase
  displayUsername: text("display_username"),
  bio: text("bio"),
  bannerImage: text("banner_image"), // Speicher-Pfad wie image
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Lunair ---

/** Ein Code = eine Person. claimedAt sperrt den Code während der Registrierung. */
export const invites = pgTable("invites", {
  code: text("code").primaryKey(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  usedBy: text("used_by").references(() => user.id, { onDelete: "set null" }),
  claimedAt: timestamp("claimed_at"),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Ein Beitrag: Text, Fotos oder beides. user.image und post_media.path sind Speicher-Pfade, keine URLs. */
export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("posts_created_at_idx").on(t.createdAt.desc()),
    index("posts_author_created_idx").on(t.authorId, t.createdAt.desc()),
  ],
);

export const postMedia = pgTable(
  "post_media",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("post_media_post_id_idx").on(t.postId)],
);

/** Eigene Sticker: 256×256 PNG mit Transparenz, für alle in der Gruppe nutzbar. */
export const stickers = pgTable(
  "stickers",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    path: text("path").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("stickers_owner_idx").on(t.ownerId)],
);

/**
 * Bis zu 3 Reaktionen pro Person und Beitrag (Limit im Code).
 * `emoji` ist der Reaktions-Schlüssel: ein Emoji oder „s:<stickerId>“.
 * Bei Sticker-Reaktionen zeigt sticker_id auf den Sticker – wird er gelöscht, verschwindet die Reaktion mit.
 */
export const postReactions = pgTable(
  "post_reactions",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    stickerId: text("sticker_id").references(() => stickers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId, t.emoji] })],
);

/** Kommentar oder Antwort. Antworten hängen immer am obersten Kommentar (eine Ebene, wie bei Insta). */
export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    body: text("body"),
    stickerId: text("sticker_id").references(() => stickers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("comments_post_created_idx").on(t.postId, t.createdAt),
    index("comments_parent_idx").on(t.parentId),
  ],
);

/** Wie post_reactions, nur für Kommentare. */
export const commentReactions = pgTable(
  "comment_reactions",
  {
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    stickerId: text("sticker_id").references(() => stickers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId, t.emoji] })],
);

export type User = typeof user.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostMedia = typeof postMedia.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Sticker = typeof stickers.$inferSelect;
