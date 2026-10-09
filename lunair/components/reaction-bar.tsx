"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toggleReaction } from "@/app/(app)/posts/interactions";
import { REACTION_LABELS, REACTIONS, type Reaction } from "@/lib/reactions";
import type { ReactionSummary } from "@/lib/posts";

type State = { reactions: ReactionSummary[]; mine: string | null };

function apply(state: State, emoji: string): State {
  const counts = new Map(state.reactions.map((r) => [r.emoji, r.count]));
  const dec = (e: string) => {
    const n = (counts.get(e) ?? 0) - 1;
    if (n > 0) counts.set(e, n);
    else counts.delete(e);
  };
  let mine: string | null = emoji;
  if (state.mine === emoji) {
    dec(emoji);
    mine = null;
  } else {
    if (state.mine) dec(state.mine);
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  const reactions = [...counts].map(([e, count]) => ({ emoji: e, count })).sort((a, b) => b.count - a.count);
  return { reactions, mine };
}

function SmileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.35rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
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

export function ReactionBar({
  postId,
  reactions,
  myReaction,
  commentCount,
  showCommentLink = true,
}: {
  postId: string;
  reactions: ReactionSummary[];
  myReaction: string | null;
  commentCount: number;
  showCommentLink?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [state, addOptimistic] = useOptimistic<State, string>({ reactions, mine: myReaction }, apply);
  const pickerRoot = useRef<HTMLDivElement>(null);

  // Auswahl schließt bei Tipp daneben oder Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!pickerRoot.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function react(emoji: Reaction) {
    setOpen(false);
    startTransition(async () => {
      addOptimistic(emoji);
      await toggleReaction(postId, emoji);
    });
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-2">
        <div className="relative" ref={pickerRoot}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={state.mine ? "Reaktion ändern" : "Reagieren"}
            className={`grid size-9 place-items-center rounded-full border ${
              open ? "border-ink text-ink" : "border-line text-muted hover:text-ink"
            }`}
          >
            <SmileIcon />
          </button>

          {open && (
            <div
              role="group"
              aria-label="Reaktion wählen"
              className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full border border-line bg-surface p-1 shadow-lg shadow-ink/10"
            >
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => react(emoji)}
                  aria-label={REACTION_LABELS[emoji]}
                  aria-pressed={state.mine === emoji}
                  className={`grid size-10 place-items-center rounded-full text-xl transition-transform active:scale-90 ${
                    state.mine === emoji ? "bg-moon/25" : "hover:bg-sky"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {state.reactions.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Reaktionen">
            {state.reactions.map((r) => (
              <li key={r.emoji}>
                <button
                  type="button"
                  onClick={() => react(r.emoji as Reaction)}
                  aria-pressed={state.mine === r.emoji}
                  aria-label={`${REACTION_LABELS[r.emoji as Reaction] ?? r.emoji}: ${r.count}`}
                  className={`flex h-9 items-center gap-1 rounded-full px-2.5 text-sm tabular-nums ${
                    state.mine === r.emoji ? "bg-moon/20 font-semibold" : "bg-surface"
                  }`}
                >
                  <span className="text-base">{r.emoji}</span>
                  {r.count}
                </button>
              </li>
            ))}
          </ul>
        )}

        {showCommentLink && (
          <Link
            href={`/p/${postId}#kommentare`}
            className="ml-auto flex h-9 items-center gap-1.5 text-sm text-muted hover:text-ink"
            aria-label={commentCount ? `${commentCount} Kommentare` : "Kommentieren"}
          >
            <CommentIcon />
            {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
          </Link>
        )}
      </div>

    </div>
  );
}
