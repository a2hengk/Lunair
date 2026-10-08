"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    // Am Handy das Teilen-Menü (WhatsApp, Snap …), sonst Zwischenablage.
    if (navigator.share) {
      try {
        await navigator.share({ title: "lunair", text: "Komm zu lunair:", url });
        return;
      } catch {
        // abgebrochen → auf Kopieren zurückfallen
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm font-medium"
    >
      {copied ? "Kopiert" : "Teilen"}
    </button>
  );
}
