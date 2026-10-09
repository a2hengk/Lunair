"use client";

/** Pfeile links/rechts. Am Handy ausgeblendet, dort wird gewischt. */
export function CarouselArrows({
  index,
  count,
  onGo,
  variant = "card",
}: {
  index: number;
  count: number;
  onGo: (i: number) => void;
  variant?: "card" | "lightbox";
}) {
  if (count < 2) return null;
  const base =
    variant === "card"
      ? "size-9 bg-white/85 text-[#161b33] shadow-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:hidden"
      : "size-11 bg-white/15 text-white hover:bg-white/25";

  return (
    <>
      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGo(index - 1);
          }}
          aria-label="Vorheriges Foto"
          className={`absolute top-1/2 left-2 z-10 grid -translate-y-1/2 place-items-center rounded-full transition-opacity ${base}`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {index < count - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGo(index + 1);
          }}
          aria-label="Nächstes Foto"
          className={`absolute top-1/2 right-2 z-10 grid -translate-y-1/2 place-items-center rounded-full transition-opacity ${base}`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}
