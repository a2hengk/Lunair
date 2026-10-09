"use client";

import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/media-url";
import { useMouseSwipe } from "@/lib/use-mouse-swipe";
import { CarouselArrows } from "./carousel-arrows";
import { Lightbox } from "./lightbox";

type Media = { path: string; width: number; height: number };

/** Seitenverhältnis wie bei Insta begrenzen: nicht höher als 4:5, nicht flacher als 1.91:1. */
function frameRatio(m: Media) {
  return Math.min(1.91, Math.max(0.8, m.width / m.height));
}

/**
 * Fotos eines Beitrags. Handy: wischen. PC: Pfeile (bei Hover), Pfeiltasten, mit der Maus ziehen.
 * Antippen öffnet die Vollbild-Ansicht.
 */
export function MediaCarousel({ media, alt }: { media: Media[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const swipe = useMouseSwipe(track, media.length);
  const ratio = frameRatio(media[0]);
  const many = media.length > 1;

  function onScroll() {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(to: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: to * el.clientWidth, behavior: "smooth" });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" && index < media.length - 1) {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "Enter") {
      setLightbox(index);
    }
  }

  return (
    <div
      className="group relative"
      role={many ? "group" : undefined}
      aria-roledescription={many ? "Karussell" : undefined}
      aria-label={alt}
    >
      <div
        ref={track}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-label={many ? `${alt}: Pfeiltasten zum Blättern, Enter für Vollbild` : `${alt}: Enter für Vollbild`}
        {...swipe.handlers}
        className={`flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] focus-visible:outline-offset-[-3px] ${swipe.dragClass}`}
        style={{ aspectRatio: ratio }}
      >
        {media.map((m, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.path}
            src={mediaUrl(m.path)}
            alt={many ? `${alt} – Foto ${i + 1} von ${media.length}` : alt}
            width={m.width}
            height={m.height}
            loading="lazy"
            decoding="async"
            draggable={false}
            onClick={() => setLightbox(i)}
            className="h-full w-full shrink-0 cursor-zoom-in snap-center bg-line object-cover select-none"
          />
        ))}
      </div>

      {many && (
        <>
          <CarouselArrows index={index} count={media.length} onGo={go} />
          <span className="pointer-events-none absolute top-2.5 right-2.5 rounded-full bg-[#161b33]/60 px-2 py-0.5 text-xs font-medium text-white">
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
        </>
      )}

      {lightbox !== null && (
        <Lightbox
          media={media}
          startIndex={lightbox}
          alt={alt}
          onClose={(last) => {
            setLightbox(null);
            // Karussell auf das zuletzt angesehene Bild stellen
            const el = track.current;
            if (el && last !== index) el.scrollTo({ left: last * el.clientWidth });
          }}
        />
      )}
    </div>
  );
}
