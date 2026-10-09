"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { FormError } from "@/components/form";
import { StickerImage } from "@/components/sticker-image";
import { MAX_STICKER_NAME, MAX_STICKERS_PER_PERSON, type StickerInfo } from "@/lib/reactions";
import { makeSticker } from "@/lib/resize-image";
import { createSticker, deleteSticker } from "./actions";

/** Schachbrett hinter der Vorschau, damit man transparente Ränder sieht. */
const CHECKER =
  "bg-[conic-gradient(var(--line)_25%,transparent_0_50%,var(--line)_0_75%,transparent_0)] bg-[length:16px_16px]";

export function StickerManager({ mine }: { mine: StickerInfo[] }) {
  const [state, action, isPending] = useActionState(createSticker, undefined);
  const [draft, setDraft] = useState<{ blob: Blob; url: string } | null>(null);
  const [name, setName] = useState("");
  const [clientError, setClientError] = useState<string>();
  const [handledOk, setHandledOk] = useState<number>();
  const input = useRef<HTMLInputElement>(null);

  // nach dem Speichern Entwurf zurücksetzen
  if (state?.ok && state.ok !== handledOk) {
    setHandledOk(state.ok);
    setDraft(null);
    setName("");
  }

  useEffect(() => {
    return () => {
      if (draft) URL.revokeObjectURL(draft.url);
    };
  }, [draft]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setClientError(undefined);
    try {
      const blob = await makeSticker(file);
      setDraft({ blob, url: URL.createObjectURL(blob) });
      if (!name) setName(file.name.replace(/\.[^.]+$/, "").slice(0, MAX_STICKER_NAME));
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Das Bild ließ sich nicht verarbeiten.");
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const fd = new FormData();
    fd.set("name", name);
    fd.set("sticker", draft.blob, "sticker.png");
    action(fd);
  }

  const full = mine.length >= MAX_STICKERS_PER_PERSON;
  const error = clientError ?? state?.error;

  return (
    <div>
      {mine.length > 0 && (
        <ul className="mb-4 grid grid-cols-4 gap-2" aria-label="Deine Sticker">
          {mine.map((s) => (
            <StickerTile key={s.id} sticker={s} />
          ))}
        </ul>
      )}

      {draft ? (
        <form onSubmit={save} className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-3">
            <div className={`grid size-24 shrink-0 place-items-center rounded-lg ${CHECKER}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.url} alt="Vorschau" className="size-24 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <label htmlFor="sticker-name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                id="sticker-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_STICKER_NAME}
                required
                placeholder="z. B. daumen"
                className="block w-full rounded-lg border border-line bg-sky px-3 py-2 text-base focus:border-dusk focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1 rounded-lg bg-ink py-2 font-semibold text-sky disabled:opacity-50"
            >
              {isPending ? "Wird gespeichert …" : "Sticker speichern"}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={isPending}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            >
              Verwerfen
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={full}
          className="w-full rounded-xl border border-dashed border-line py-3 font-semibold text-muted hover:text-ink disabled:opacity-50"
        >
          {full ? `Maximum erreicht (${MAX_STICKERS_PER_PERSON})` : "Sticker erstellen"}
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-label="Bild für Sticker auswählen"
      />
      <p className="mt-2 text-xs text-muted">
        Am besten ein freigestelltes PNG. Wird auf 256 × 256 px gebracht, nichts wird abgeschnitten. {mine.length}/
        {MAX_STICKERS_PER_PERSON}
      </p>
      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}
    </div>
  );
}

function StickerTile({ sticker }: { sticker: StickerInfo }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <li className={`relative rounded-xl border border-line bg-surface p-2 text-center ${isPending ? "opacity-50" : ""}`}>
      <div className="grid place-items-center">
        <StickerImage sticker={sticker} size="md" />
      </div>
      <p className="mt-1 truncate text-xs text-muted">{sticker.name}</p>
      {confirming ? (
        <button
          type="button"
          onClick={() => startTransition(() => deleteSticker(sticker.id))}
          onBlur={() => !isPending && setConfirming(false)}
          autoFocus
          aria-label={`Sticker „${sticker.name}“ wirklich löschen`}
          className="absolute inset-x-1 bottom-1 rounded-lg bg-danger py-1 text-xs font-semibold text-white"
        >
          Löschen
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Sticker „${sticker.name}“ löschen`}
          className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-sky text-sm leading-none text-muted hover:text-danger"
        >
          ×
        </button>
      )}
    </li>
  );
}
