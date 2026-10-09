"use client";

import { useActionState, useState, useTransition } from "react";
import { addComment, deleteComment } from "../../posts/interactions";
import { MAX_COMMENT } from "@/lib/reactions";

export function CommentForm({ postId }: { postId: string }) {
  const [state, action, isPending] = useActionState(addComment, undefined);
  const [body, setBody] = useState("");
  const [clearedFor, setClearedFor] = useState<number>();

  // nach erfolgreichem Absenden leeren; bei Fehler bleibt der Text stehen
  if (state?.ok && state.ok !== clearedFor) {
    setClearedFor(state.ok);
    setBody("");
  }

  const tooLong = body.length > MAX_COMMENT;

  return (
    <form action={action} className="pb-6">
      <input type="hidden" name="postId" value={postId} />
      <label htmlFor="comment" className="sr-only">
        Kommentar
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="comment"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            // Strg/Cmd+Enter schickt ab, Enter allein macht eine neue Zeile
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={1}
          placeholder="Kommentieren …"
          className="field-sizing-content block max-h-40 min-h-11 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-dusk focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim() || tooLong}
          className="h-11 shrink-0 rounded-xl bg-ink px-4 font-semibold text-sky disabled:opacity-40"
        >
          {isPending ? "…" : "Senden"}
        </button>
      </div>
      {(tooLong || state?.error) && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {tooLong ? `Zu lang (${body.length}/${MAX_COMMENT})` : state?.error}
        </p>
      )}
    </form>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Kommentar löschen"
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => startTransition(() => deleteComment(commentId))}
      onBlur={() => !isPending && setConfirming(false)}
      autoFocus
      disabled={isPending}
      aria-label="Kommentar wirklich löschen"
      className="h-8 shrink-0 rounded-lg bg-danger px-2.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {isPending ? "…" : "Löschen"}
    </button>
  );
}
