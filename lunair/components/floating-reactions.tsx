"use client";

import { useEffect, useRef, useState } from "react";
import type { CommentPreview } from "@/lib/posts";
import type { ReactionSummary } from "@/lib/reactions";
import { StickerImage } from "./sticker-image";

/** Pro Sitzung spielt jeder Beitrag die Animation nur einmal ab. */
const played = new Set<string>();

const PER_REACTION = 5; // höchstens so viele Teilchen pro Reaktionsart
const MAX_PARTICLES = 14;

type Particle = {
  id: string;
  kind: "reaction" | "comment";
  reaction?: ReactionSummary;
  comment?: CommentPreview;
  style: React.CSSProperties;
  /** ms bis das Teilchen verschwunden ist */
  end: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffle<T>(list: T[]) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function build(reactions: ReactionSummary[], comments: CommentPreview[], height: number): Particle[] {
  // Je mehr Reaktionen, desto mehr Teilchen – gedeckelt, damit es ruhig bleibt
  const pool: ReactionSummary[] = [];
  for (const r of reactions) for (let i = 0; i < Math.min(r.count, PER_REACTION); i++) pool.push(r);
  const picked = shuffle(pool).slice(0, MAX_PARTICLES);
  const rise = Math.min(260, height * 0.8);

  const particles: Particle[] = picked.map((r, i) => {
    const delay = i * 170 + rand(0, 120);
    const dur = rand(2300, 3000);
    return {
      id: `r${i}`,
      kind: "reaction",
      reaction: r,
      end: delay + dur,
      style: {
        left: `${rand(6, 62)}%`,
        ["--dx" as string]: `${rand(-36, 36)}px`,
        ["--rise" as string]: `${rand(rise * 0.7, rise)}px`,
        ["--s" as string]: rand(0.85, 1.25),
        ["--delay" as string]: `${delay}ms`,
        ["--dur" as string]: `${dur}ms`,
      },
    };
  });

  comments.forEach((c, j) => {
    const delay = 350 + j * 1000; // genug Abstand, damit sich die Blasen nicht überlappen
    const dur = 3400;
    particles.push({
      id: `c${c.id}`,
      kind: "comment",
      comment: c,
      end: delay + dur,
      style: {
        left: "1rem",
        ["--dx" as string]: `${rand(0, 24)}px`,
        ["--rise" as string]: `${Math.min(200, height * 0.6)}px`,
        ["--s" as string]: 1,
        ["--delay" as string]: `${delay}ms`,
        ["--dur" as string]: `${dur}ms`,
      },
    });
  });

  return particles;
}

/**
 * Kommt ein Beitrag ins Bild, steigen seine Reaktionen und die neuesten Kommentare kurz auf und verblassen.
 * Nichts davon ist anklickbar; bei „Bewegung reduzieren“ passiert gar nichts.
 */
export function FloatingReactions({
  postId,
  reactions,
  comments,
}: {
  postId: string;
  reactions: ReactionSummary[];
  comments: CommentPreview[];
}) {
  const layer = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const hasContent = reactions.length > 0 || comments.length > 0;

  useEffect(() => {
    const el = layer.current;
    if (!el || !hasContent || played.has(postId)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || played.has(postId)) return;
        played.add(postId);
        observer.disconnect();
        const list = build(reactions, comments, el.clientHeight);
        setParticles(list);
        // aufräumen, wenn das letzte Teilchen durch ist
        timer = window.setTimeout(() => setParticles([]), Math.max(...list.map((p) => p.end)) + 200);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
    // Reaktionen ändern sich durch eigenes Reagieren – die Animation soll dann nicht neu starten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, hasContent]);

  return (
    <div ref={layer} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {particles.map((p) =>
        p.kind === "reaction" ? (
          <span key={p.id} data-float="reaction" className="float-away absolute bottom-16 text-3xl" style={p.style}>
            {p.reaction!.sticker ? <StickerImage sticker={p.reaction!.sticker} size="sm" decorative /> : p.reaction!.key}
          </span>
        ) : (
          <span
            key={p.id}
            data-float="comment"
            className="float-away float-away-even absolute bottom-14 flex max-w-[75%] items-center gap-2 rounded-2xl bg-surface/90 px-3 py-1.5 text-sm text-ink shadow-md backdrop-blur"
            style={p.style}
          >
            <span className="shrink-0 font-semibold">{p.comment!.author}</span>
            {p.comment!.body ? (
              <span className="truncate">{p.comment!.body}</span>
            ) : p.comment!.sticker ? (
              <StickerImage sticker={p.comment!.sticker} size="xs" decorative />
            ) : null}
          </span>
        ),
      )}
    </div>
  );
}
