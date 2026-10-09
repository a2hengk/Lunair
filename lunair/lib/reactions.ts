/** Feste Auswahl – hält die Anzeige kompakt und verhindert Emoji-Spam. Reihenfolge = Anzeige-Reihenfolge. */
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

export function isReaction(value: string): value is Reaction {
  return (REACTIONS as readonly string[]).includes(value);
}

export const MAX_COMMENT = 500;
