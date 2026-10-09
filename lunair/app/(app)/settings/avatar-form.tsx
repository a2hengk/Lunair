"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { FormError } from "@/components/form";
import { resizeImage } from "@/lib/resize-image";
import { removeAvatar, updateAvatar } from "./actions";

export function AvatarForm({ name, seed, image }: { name: string; seed: string; image: string | null }) {
  const [state, action] = useActionState(updateAvatar, undefined);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // gleiche Datei nochmal wählbar
    if (!file) return;
    setClientError(undefined);

    try {
      const { blob } = await resizeImage(file, { maxEdge: 512, aspect: 1, maxBytes: 300_000 });
      setPreview(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.set("avatar", blob, "avatar.jpg");
      startTransition(() => action(fd));
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Das Bild ließ sich nicht verarbeiten.");
    }
  }

  // Vorschau nur solange der Upload läuft; danach kommt das gespeicherte Bild vom Server.
  const shown = isPending && preview ? preview : image;
  const error = clientError ?? state?.error;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <span className={isPending ? "opacity-60" : undefined}>
          <Avatar name={name} seed={seed} image={shown} size="lg" />
        </span>
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={isPending}
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {isPending ? "Wird hochgeladen …" : image ? "Profilbild ändern" : "Profilbild hinzufügen"}
          </button>
          {image && !isPending && (
            <button
              type="button"
              onClick={() => startTransition(() => removeAvatar())}
              className="px-1 text-sm text-muted hover:text-danger"
            >
              Entfernen
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-label="Profilbild auswählen"
      />
      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}
    </div>
  );
}
