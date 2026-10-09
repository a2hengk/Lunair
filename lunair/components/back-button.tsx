"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Zählt Seitenwechsel innerhalb der App (überlebt Client-Navigation, nicht Reloads).
let inAppNavigations = 0;

/** Einmal im Layout: merkt sich, ob es eine Seite in der App gibt, zu der man zurück kann. */
export function NavigationTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    inAppNavigations += 1;
  }, [pathname]);
  return null;
}

/**
 * Zurück wie im Browser, wenn man innerhalb von lunair hergekommen ist (Scroll-Position bleibt).
 * Kam man per Link direkt hierher, geht es zu `fallback` statt raus aus der App.
 */
export function BackButton({ fallback = "/", label = "Zurück" }: { fallback?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (inAppNavigations > 0 ? router.back() : router.push(fallback))}
      aria-label={label}
      className="-ml-2 grid size-10 place-items-center rounded-full text-ink hover:bg-surface"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
