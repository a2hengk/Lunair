"use client";

import { useRef, useState, type RefObject } from "react";

/**
 * Wischen mit der Maus für horizontale Scroll-Snap-Leisten (am Handy wischt der Browser selbst).
 * Ziehen > 15 % der Breite blättert weiter; ein Ziehen löst danach keinen Klick aus.
 */
export function useMouseSwipe(track: RefObject<HTMLElement | null>, count: number) {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  // während des Ziehens (und bis die Animation durch ist) Snap aus, sonst springt es dazwischen
  const [dragging, setDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0 || count < 2) return;
    const el = track.current;
    if (!el) return;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const el = track.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    if (d.moved) el.scrollTo({ left: d.left - dx });
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    const el = track.current;
    drag.current = null;
    if (!d || !el || !d.moved) return;

    suppressClick.current = true;
    const w = el.clientWidth;
    const dx = e.clientX - d.x;
    let i = Math.round(d.left / w);
    if (dx < -w * 0.15) i += 1;
    else if (dx > w * 0.15) i -= 1;
    i = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: i * w, behavior: "smooth" });
    window.setTimeout(() => setDragging(false), 450);
  }

  function onClickCapture(e: React.MouseEvent) {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClickCapture },
    /** an die Leiste hängen: schaltet Snap beim Ziehen ab */
    dragClass: dragging ? "!snap-none cursor-grabbing" : "",
  };
}
