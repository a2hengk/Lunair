"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mediaUrl } from "@/lib/media-url";
import { useMouseSwipe } from "@/lib/use-mouse-swipe";
import { CarouselArrows } from "./carousel-arrows";

type Media = { path: string; width: number; height: number };

const ZOOM = 2.5;

/**
 * Vollbild-Ansicht: wischen/Pfeile/Tasten zum Blättern,
 * Klick (Maus) oder Doppeltipp (Handy) zoomt, Bewegung verschiebt den Ausschnitt.
 */
export function Lightbox({
  media,
  startIndex,
  alt,
  onClose,
}: {
  media: Media[];
  startIndex: number;
  alt: string;
  /** bekommt das zuletzt gezeigte Bild mit */
  onClose: (lastIndex: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastTap = useRef(0);
  const mouseDownX = useRef<number | null>(null);
  const swipe = useMouseSwipe(track, media.length);

  // Startbild ohne Animation anzeigen
  useLayoutEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = startIndex * el.clientWidth;
  }, [startIndex]);

  // Seite darunter festhalten, Fokus rein und beim Schließen zurück
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    setZoom(null);
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose(index);
      else if (e.key === "ArrowRight" && index < media.length - 1) go(index + 1);
      else if (e.key === "ArrowLeft" && index > 0) go(index - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, media.length, onClose]);

  function onScroll() {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) {
      setIndex(i);
      setZoom(null);
    }
  }

  function originFrom(e: React.PointerEvent<HTMLImageElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
    };
  }

  /** Maus: Klick (ohne Ziehen) zoomt. Touch: Doppeltipp zoomt. */
  function onImagePointerUp(e: React.PointerEvent<HTMLImageElement>) {
    if (e.pointerType === "mouse") {
      const startX = mouseDownX.current;
      mouseDownX.current = null;
      if (startX !== null && Math.abs(e.clientX - startX) < 6) setZoom((z) => (z ? null : originFrom(e)));
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setZoom((z) => (z ? null : originFrom(e)));
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} – Vollbild`}
      className="fixed inset-0 z-50 flex flex-col bg-[#0a0c18]"
      onClick={() => onClose(index)}
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 text-white">
        <span className="text-sm tabular-nums">{media.length > 1 ? `${index + 1}/${media.length}` : ""}</span>
        <button
          ref={closeBtn}
          type="button"
          onClick={() => onClose(index)}
          aria-label="Vollbild schließen"
          className="grid size-10 place-items-center rounded-full bg-white/15 text-2xl leading-none hover:bg-white/25"
        >
          ×
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
        <div
          ref={track}
          onScroll={onScroll}
          {...swipe.handlers}
          className={`flex h-full snap-x snap-mandatory [scrollbar-width:none] ${zoom ? "overflow-hidden" : "overflow-x-auto"} ${swipe.dragClass}`}
        >
          {media.map((m, i) => {
            const active = i === index && zoom;
            return (
              <div
                key={m.path}
                className="grid h-full w-full shrink-0 snap-center place-items-center overflow-hidden"
                onClick={(e) => e.target === e.currentTarget && onClose(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(m.path)}
                  alt={media.length > 1 ? `${alt} – Foto ${i + 1} von ${media.length}` : alt}
                  width={m.width}
                  height={m.height}
                  draggable={false}
                  onPointerDown={(e) => {
                    if (e.pointerType === "mouse" && e.button === 0) mouseDownX.current = e.clientX;
                  }}
                  onPointerUp={onImagePointerUp}
                  onPointerMove={(e) => {
                    if (active) setZoom(originFrom(e));
                  }}
                  style={
                    active
                      ? { transform: `scale(${ZOOM})`, transformOrigin: `${zoom.x}% ${zoom.y}%`, touchAction: "none" }
                      : undefined
                  }
                  className={`max-h-full max-w-full object-contain transition-transform duration-200 select-none ${
                    active ? "cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                />
              </div>
            );
          })}
        </div>
        {!zoom && <CarouselArrows index={index} count={media.length} onGo={go} variant="lightbox" />}
      </div>

      <p className="px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs text-white/60">
        {zoom ? "Bewegen zum Verschieben, nochmal tippen zum Verkleinern" : "Klicken oder doppelt tippen zum Zoomen"}
      </p>
    </div>,
    document.body,
  );
}
