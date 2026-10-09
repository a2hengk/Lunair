"use client";

import { useState, useTransition } from "react";
import { deletePost } from "../../posts/actions";

/** Zweistufig statt Browser-Dialog: erst „Löschen“, dann bestätigen. */
export function DeletePostButton({ postId }: { postId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="py-1 text-sm text-muted hover:text-danger">
        Löschen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <button type="button" onClick={() => setConfirming(false)} disabled={isPending} className="py-1 text-muted">
        Abbrechen
      </button>
      <button
        type="button"
        onClick={() => startTransition(() => deletePost(postId))}
        disabled={isPending}
        className="rounded-lg bg-danger px-3 py-1.5 font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Wird gelöscht …" : "Beitrag löschen"}
      </button>
    </div>
  );
}
