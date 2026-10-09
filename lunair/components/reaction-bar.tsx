"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toggleReaction, type ReactionTarget } from "@/app/(app)/posts/interactions";
import {
  MAX_REACTIONS_PER_PERSON,
  REACTION_LABELS,
  REACTIONS,
  reactionLabel,
  stickerKey,
  type ReactionSummary,
  type StickerInfo,
} from "@/lib/reactions";
import { StickerImage } from "./sticker-image";
import { useStickers } from "./stickers-context";

type State = { reactions: ReactionSummary[]; mine: string[] };

function toggle(state: State, action: { key: string; sticker: StickerInfo | null }): State {
  const { key, sticker } = action;
  const has = state.mine.includes(key);
  if (!has && state.mine.length >= MAX_REACTIONS_PER_PERSON) return state;

  const reactions = state.reactions
    .map((r) => (r.key === key ? { ...r, count: r.count + (has ? -1 : 1) } : r))
    .filter((r) => r.count > 0);
  if (!has && !reactions.some((r) => r.key === key)) reactions.push({ key, count: 1, sticker });

  return { reactions, mine: has ? state.mine.filter((k) => k !== key) : [...state.mine, key] };
}

function SmileIcon({ small }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={small ? "size-4" : "size-[1.35rem]"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" strokeLinecap="round" />
      <circle cx="9.3" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.35rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 1 1 3.4 6.3L4 19.5l1.2-3.6A7.5 7.5 0 0 1 4.5 12Z" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Reaktionen für Beiträge (size="post") und Kommentare (size="comment").
 * Jede Person kann bis zu 3 verschiedene setzen; antippen = setzen, nochmal = wegnehmen.
 */
export function Reactions({
  target,
  reactions,
  myReactions,
  size = "post",
  children,
}: {
  target: ReactionTarget;
  reactions: ReactionSummary[];
  myReactions: string[];
  size?: "post" | "comment";
  /** rechts in der Zeile, z. B. der Kommentar-Link */
  children?: React.ReactNode;
}) {
  const stickers = useStickers();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [, startTransition] = useTransition();
  const [state, addOptimistic] = useOptimistic<State, { key: string; sticker: StickerInfo | null }>(
    { reactions, mine: myReactions },
    toggle,
  );
  const root = useRef<HTMLDivElement>(null);
  const small = size === "comment";
  const full = state.mine.length >= MAX_REACTIONS_PER_PERSON;

  // Auswahl schließt bei Tipp daneben oder Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(undefined), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  function react(key: string, sticker: StickerInfo | null) {
    if (!state.mine.includes(key) && full) {
      setNotice(`Höchstens ${MAX_REACTIONS_PER_PERSON} Reaktionen – tipp eine an, um sie wegzunehmen.`);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      addOptimistic({ key, sticker });
      const res = await toggleReaction(target, key);
      if (res.error) setNotice(res.error);
    });
  }

  const chipBase = small ? "h-7 gap-1 px-2 text-xs" : "h-9 gap-1 px-2.5 text-sm";

  return (
    <div className={small ? "" : "px-4 pt-3"}>
      <div className={`flex flex-wrap items-center ${small ? "gap-1.5" : "gap-2"}`}>
        <div className="relative" ref={root}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={small ? "Auf Kommentar reagieren" : "Reagieren"}
            className={`grid place-items-center rounded-full border ${small ? "size-7" : "size-9"} ${
              open ? "border-ink text-ink" : "border-line text-muted hover:text-ink"
            }`}
          >
            <SmileIcon small={small} />
          </button>

          {open && (
            <div
              role="group"
              aria-label="Reaktion wählen"
              className="absolute bottom-full left-0 z-20 mb-2 w-[17.5rem] rounded-2xl border border-line bg-surface p-1.5 shadow-lg shadow-ink/10"
            >
              <div className="flex justify-between">
                {REACTIONS.map((emoji) => {
                  const on = state.mine.includes(emoji);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => react(emoji, null)}
                      aria-label={REACTION_LABELS[emoji]}
                      aria-pressed={on}
                      className={`grid size-10 place-items-center rounded-full text-xl transition-transform active:scale-90 ${
                        on ? "bg-moon/25" : full ? "opacity-40" : "hover:bg-sky"
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>

              {stickers.length > 0 ? (
                <div className="mt-1.5 border-t border-line pt-1.5">
                  <div className="grid max-h-36 grid-cols-6 gap-0.5 overflow-y-auto" aria-label="Sticker">
                    {stickers.map((s) => {
                      const key = stickerKey(s.id);
                      const on = state.mine.includes(key);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => react(key, s)}
                          aria-label={`Sticker „${s.name}“`}
                          aria-pressed={on}
                          className={`grid size-10 place-items-center rounded-lg ${
                            on ? "bg-moon/25" : full ? "opacity-40" : "hover:bg-sky"
                          }`}
                        >
                          <StickerImage sticker={s} size="sm" decorative />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  href="/settings#sticker"
                  className="mt-1.5 block border-t border-line px-2 pt-2 pb-1 text-xs text-muted hover:text-ink"
                >
                  Eigene Sticker in den Einstellungen erstellen
                </Link>
              )}

              <p className="px-2 pt-1 text-[0.7rem] text-muted">
                {state.mine.length}/{MAX_REACTIONS_PER_PERSON} vergeben
              </p>
            </div>
          )}
        </div>

        {state.reactions.length > 0 && (
          <ul className={`flex flex-wrap ${small ? "gap-1" : "gap-1.5"}`} aria-label="Reaktionen">
            {state.reactions.map((r) => {
              const on = state.mine.includes(r.key);
              return (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => react(r.key, r.sticker)}
                    aria-pressed={on}
                    aria-label={`${reactionLabel(r)}: ${r.count}`}
                    className={`flex items-center rounded-full tabular-nums ${chipBase} ${
                      on ? "bg-moon/20 font-semibold ring-1 ring-moon/60" : "bg-surface"
                    }`}
                  >
                    {r.sticker ? (
                      <StickerImage sticker={r.sticker} size="xs" decorative />
                    ) : (
                      <span className={small ? "text-sm" : "text-base"}>{r.key}</span>
                    )}
                    {r.count}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {children && <div className="ml-auto">{children}</div>}
      </div>

      {notice && (
        <p role="status" className="mt-1.5 text-xs text-danger">
          {notice}
        </p>
      )}
    </div>
  );
}

/** Reaktionsleiste unter einem Beitrag, rechts der Kommentar-Link. */
export function ReactionBar({
  postId,
  reactions,
  myReactions,
  commentCount,
  showCommentLink = true,
}: {
  postId: string;
  reactions: ReactionSummary[];
  myReactions: string[];
  commentCount: number;
  showCommentLink?: boolean;
}) {
  return (
    <Reactions target={{ kind: "post", id: postId }} reactions={reactions} myReactions={myReactions}>
      {showCommentLink && (
        <Link
          href={`/p/${postId}#kommentare`}
          className="flex h-9 items-center gap-1.5 text-sm text-muted hover:text-ink"
          aria-label={commentCount ? `${commentCount} Kommentare` : "Kommentieren"}
        >
          <CommentIcon />
          {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
        </Link>
      )}
    </Reactions>
  );
}
