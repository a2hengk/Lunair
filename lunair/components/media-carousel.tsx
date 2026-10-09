"use client";

import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/media-url";

type Media = { path: string; width: number; height: number };

/** Seitenverhältnis wie bei Insta begrenzen: nicht höher als 4:5, nicht flacher als 1.91:1. */
function frameRatio(m: Media) {
  return Math.min(1.91, Math.max(0.8, m.width / m.height));
}

export function MediaCarousel({ media, alt }: { media: Media[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const ratio = frameRatio(media[0]);

  if (media.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(media[0].path)}
        alt={alt}
        width={media[0].width}
        height={media[0].height}
        loading="lazy"
        decoding="async"
        className="w-full bg-line object-cover"
        style={{ aspectRatio: ratio }}
      />
    );
  }

  function onScroll() {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(to: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative" role="group" aria-roledescription="Karussell" aria-label={alt}>
      <div
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        style={{ aspectRatio: ratio }}
      >
        {media.map((m, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.path}
            src={mediaUrl(m.path)}
            alt={`${alt} – Foto ${i + 1} von ${media.length}`}
            width={m.width}
            height={m.height}
            loading="lazy"
            decoding="async"
            className="h-full w-full shrink-0 snap-center bg-line object-cover"
          />
        ))}
      </div>
      <span className="absolute top-2.5 right-2.5 rounded-full bg-[#161b33]/60 px-2 py-0.5 text-xs font-medium text-white">
        {index + 1}/{media.length}
      </span>
      <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
        {media.map((m, i) => (
          <button
            key={m.path}
            type="button"
            onClick={() => go(i)}
            aria-label={`Foto ${i + 1} zeigen`}
            aria-current={i === index}
            className={`size-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
