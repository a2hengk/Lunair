/** Feste Emoji-Auswahl; dazu kommen die eigenen Sticker der Gruppe. Reihenfolge = Anzeige-Reihenfolge. */
export const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "🙌"] as const;
export type Reaction = (typeof REACTIONS)[number];

export const REACTION_LABELS: Record<Reaction, string> = {
  "❤️": "Herz",
  "😂": "Lachen",
  "😮": "Staunen",
  "😢": "Traurig",
  "🔥": "Feuer",
  "🙌": "Jubel",
};

/** Pro Person und Beitrag/Kommentar – damit es nicht zu viel wird. */
export const MAX_REACTIONS_PER_PERSON = 3;

export const MAX_COMMENT = 500;
export const MAX_STICKERS_PER_PERSON = 30;
export const MAX_STICKER_NAME = 24;

/** Reaktions-Schlüssel: ein Emoji aus REACTIONS oder „s:<stickerId>“. */
const STICKER_PREFIX = "s:";

export function stickerKey(stickerId: string) {
  return STICKER_PREFIX + stickerId;
}

export function parseReactionKey(key: string): { emoji: Reaction } | { stickerId: string } | null {
  if ((REACTIONS as readonly string[]).includes(key)) return { emoji: key as Reaction };
  if (key.startsWith(STICKER_PREFIX)) {
    const id = key.slice(STICKER_PREFIX.length);
    if (/^[0-9a-f-]{36}$/.test(id)) return { stickerId: id };
  }
  return null;
}

export type StickerInfo = { id: string; name: string; path: string };

/** Zusammenfassung einer Reaktion für die Anzeige. */
export type ReactionSummary = { key: string; count: number; sticker: StickerInfo | null };

export function reactionLabel(r: { key: string; sticker: StickerInfo | null }) {
  if (r.sticker) return `Sticker „${r.sticker.name}“`;
  return REACTION_LABELS[r.key as Reaction] ?? r.key;
}

export function sortReactions<T extends { key: string; count: number }>(list: T[]) {
  const order = (k: string) => {
    const i = (REACTIONS as readonly string[]).indexOf(k);
    return i === -1 ? 99 : i;
  };
  return list.sort((a, b) => b.count - a.count || order(a.key) - order(b.key));
}
