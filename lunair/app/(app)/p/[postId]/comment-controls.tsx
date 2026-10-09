"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useState, useTransition } from "react";
import { StickerImage } from "@/components/sticker-image";
import { useStickers } from "@/components/stickers-context";
import { MAX_COMMENT, type StickerInfo } from "@/lib/reactions";
import { addComment, deleteComment, type CommentState } from "../../posts/interactions";

// ---------- Antwort-Ziel, geteilt zwischen „Antworten“-Knöpfen und dem Formular ----------

type ReplyTarget = { commentId: string; name: string; username: string | null };
const ReplyContext = createContext<{ replyTo: ReplyTarget | null; setReplyTo: (t: ReplyTarget | null) => void }>({
  replyTo: null,
  setReplyTo: () => {},
});

export function ReplyProvider({ children }: { children: React.ReactNode }) {
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  return <ReplyContext.Provider value={{ replyTo, setReplyTo }}>{children}</ReplyContext.Provider>;
}

export function ReplyButton(target: ReplyTarget) {
  const { setReplyTo } = useContext(ReplyContext);
  return (
    <button
      type="button"
      onClick={() => setReplyTo(target)}
      className="h-7 px-1 text-xs font-semibold text-muted hover:text-ink"
      aria-label={`${target.name} antworten`}
    >
      Antworten
    </button>
  );
}

// ---------- Formular ----------

export function CommentForm({ postId }: { postId: string }) {
  const { replyTo, setReplyTo } = useContext(ReplyContext);
  const stickers = useStickers();
  const [body, setBody] = useState("");
  const [sticker, setSticker] = useState<StickerInfo | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [handledReply, setHandledReply] = useState<ReplyTarget | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  // nach erfolgreichem Absenden alles zurücksetzen; bei Fehler bleibt alles stehen
  const [state, action, isPending] = useActionState(async (prev: CommentState, fd: FormData) => {
    const res = await addComment(prev, fd);
    if (res?.ok) {
      setBody("");
      setSticker(null);
      setReplyTo(null);
    }
    return res;
  }, undefined);

  // beim Antworten den Namen vorbelegen
  if (replyTo !== handledReply) {
    setHandledReply(replyTo);
    if (replyTo?.username) {
      const mention = `@${replyTo.username} `;
      setBody((b) => (b.trim() === "" || /^@\S+\s*$/.test(b) ? mention : b));
    }
  }

  // Formular in Sicht holen und Fokus setzen, wenn „Antworten“ getippt wurde
  useEffect(() => {
    if (!replyTo || !textarea.current) return;
    textarea.current.scrollIntoView({ block: "center", behavior: "smooth" });
    textarea.current.focus();
    const end = textarea.current.value.length;
    textarea.current.setSelectionRange(end, end);
  }, [replyTo]);

  const tooLong = body.length > MAX_COMMENT;
  const empty = !body.trim() && !sticker;

  return (
    <form action={action} className="pb-6">
      <input type="hidden" name="postId" value={postId} />
      {replyTo && <input type="hidden" name="replyTo" value={replyTo.commentId} />}
      {sticker && <input type="hidden" name="stickerId" value={sticker.id} />}

      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-sm">
          <span className="text-muted">
            Antwort an <span className="font-semibold text-ink">{replyTo.name}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setReplyTo(null);
              setBody((b) => b.replace(/^@\S+\s*/, ""));
            }}
            aria-label="Antwort abbrechen"
            className="px-1 text-lg leading-none text-muted hover:text-ink"
          >
            ×
          </button>
        </div>
      )}

      {sticker && (
        <div className="mb-2 flex items-center gap-2">
          <StickerImage sticker={sticker} size="md" />
          <button
            type="button"
            onClick={() => setSticker(null)}
            className="text-sm text-muted hover:text-danger"
            aria-label="Sticker entfernen"
          >
            Entfernen
          </button>
        </div>
      )}

      <label htmlFor="comment" className="sr-only">
        Kommentar
      </label>
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setTrayOpen((o) => !o)}
          aria-expanded={trayOpen}
          aria-label="Sticker auswählen"
          className={`grid size-11 shrink-0 place-items-center rounded-xl border ${
            trayOpen ? "border-ink text-ink" : "border-line text-muted hover:text-ink"
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M14 20H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6l-6 6Z" strokeLinejoin="round" />
            <path d="M14 20v-3a3 3 0 0 1 3-3h3" strokeLinejoin="round" />
          </svg>
        </button>
        <textarea
          ref={textarea}
          id="comment"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            // Strg/Cmd+Enter schickt ab, Enter allein macht eine neue Zeile
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={1}
          placeholder={replyTo ? "Antworten …" : "Kommentieren …"}
          className="field-sizing-content block max-h-40 min-h-11 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-dusk focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || empty || tooLong}
          className="h-11 shrink-0 rounded-xl bg-ink px-4 font-semibold text-sky disabled:opacity-40"
        >
          {isPending ? "…" : "Senden"}
        </button>
      </div>

      {trayOpen && (
        <div className="mt-2 rounded-xl border border-line bg-surface p-2" role="group" aria-label="Sticker">
          {stickers.length ? (
            <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto">
              {stickers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSticker(s);
                    setTrayOpen(false);
                  }}
                  aria-label={`Sticker „${s.name}“ senden`}
                  className="grid aspect-square place-items-center rounded-lg hover:bg-sky"
                >
                  <StickerImage sticker={s} size="sm" decorative />
                </button>
              ))}
            </div>
          ) : (
            <p className="px-1 py-2 text-sm text-muted">
              Noch keine Sticker.{" "}
              <a href="/settings#sticker" className="font-semibold text-dusk">
                In den Einstellungen erstellen
              </a>
            </p>
          )}
        </div>
      )}

      {(tooLong || state?.error) && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {tooLong ? `Zu lang (${body.length}/${MAX_COMMENT})` : state?.error}
        </p>
      )}
    </form>
  );
}

// ---------- Löschen ----------

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Kommentar löschen"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
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
      className="h-7 shrink-0 rounded-lg bg-danger px-2.5 text-xs font-semibold text-white disabled:opacity-60"
    >
      {isPending ? "…" : "Löschen"}
    </button>
  );
}
