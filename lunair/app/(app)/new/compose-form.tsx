"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { FormError } from "@/components/form";
import { MAX_BODY, MAX_PHOTOS } from "@/lib/post-limits";
import { resizeImage } from "@/lib/resize-image";
import { createPost } from "../posts/actions";

type Picked = { id: string; file: File; preview: string };

export function ComposeForm() {
  const [state, action] = useActionState(createPost, undefined);
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState(state?.body ?? "");
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [clientError, setClientError] = useState<string>();
  const [preparing, setPreparing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Vorschau-URLs freigeben, wenn die Seite verlassen wird
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setClientError(undefined);
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setClientError(`Höchstens ${MAX_PHOTOS} Fotos pro Beitrag.`);
    const next = files.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((p) => [...p, ...next]);
  }

  function removePhoto(id: string) {
    setPhotos((p) => {
      const gone = p.find((x) => x.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return p.filter((x) => x.id !== id);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setClientError(undefined);
    if (!body.trim() && photos.length === 0) {
      setClientError("Schreib etwas oder wähl ein Foto aus.");
      return;
    }

    setPreparing(true);
    try {
      const fd = new FormData();
      fd.set("body", body);
      const resized = await Promise.all(photos.map((p) => resizeImage(p.file, { maxEdge: 1600 })));
      resized.forEach((r, i) => fd.append("photos", r.blob, `foto-${i + 1}.jpg`));
      startTransition(() => action(fd));
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Die Fotos ließen sich nicht vorbereiten.");
    } finally {
      setPreparing(false);
    }
  }

  const busy = preparing || isPending;
  const error = clientError ?? state?.error;
  const tooLong = body.length > MAX_BODY;

  return (
    <form onSubmit={submit} className="flex min-h-[calc(100dvh-4.5rem)] flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href="/" className="py-1 text-muted hover:text-ink">
          Abbrechen
        </Link>
        <h1 className="font-semibold">Neuer Beitrag</h1>
        <button
          type="submit"
          disabled={busy || tooLong}
          className="rounded-lg bg-ink px-4 py-1.5 font-semibold text-sky disabled:opacity-50"
        >
          {busy ? "Wird geteilt …" : "Teilen"}
        </button>
      </header>

      <div className="px-4">
        <label htmlFor="body" className="sr-only">
          Text
        </label>
        <textarea
          id="body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Wie war dein Tag?"
          rows={photos.length ? 3 : 7}
          className="block w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-3 text-lg text-ink placeholder:text-muted/70 focus:border-dusk focus:outline-none"
        />
        <p className={`mt-1 text-right text-xs ${tooLong ? "text-danger" : "text-muted"}`}>
          {body.length}/{MAX_BODY}
        </p>

        {photos.length > 0 && (
          <ul className="mt-2 grid grid-cols-2 gap-2" aria-label="Ausgewählte Fotos">
            {photos.map((p, i) => (
              <li key={p.id} className="relative overflow-hidden rounded-xl bg-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt={`Foto ${i + 1}`} className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  disabled={busy}
                  aria-label={`Foto ${i + 1} entfernen`}
                  className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-[#161b33]/70 text-lg leading-none text-white"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3.5 font-medium text-muted hover:text-ink disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <circle cx="9" cy="11" r="2" />
              <path d="m21 16-5-5-8 8" strokeLinejoin="round" />
            </svg>
            {photos.length ? `Foto hinzufügen (${photos.length}/${MAX_PHOTOS})` : "Fotos hinzufügen"}
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={addFiles}
          className="sr-only"
          tabIndex={-1}
          aria-label="Fotos auswählen"
        />

        {error && (
          <div className="mt-4">
            <FormError message={error} />
          </div>
        )}
      </div>
    </form>
  );
}
