"use client";

import { createContext, useContext } from "react";
import type { StickerInfo } from "@/lib/reactions";

/** Alle Sticker der Gruppe, einmal im Layout geladen – für Picker und Kommentar-Feld. */
const StickersContext = createContext<StickerInfo[]>([]);

export function StickersProvider({ stickers, children }: { stickers: StickerInfo[]; children: React.ReactNode }) {
  return <StickersContext.Provider value={stickers}>{children}</StickersContext.Provider>;
}

export function useStickers() {
  return useContext(StickersContext);
}
