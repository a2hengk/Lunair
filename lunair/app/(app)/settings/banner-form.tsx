"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { FormError } from "@/components/form";
import { ProfileBanner } from "@/components/profile-banner";
import { resizeImage } from "@/lib/resize-image";
import { removeBanner, updateBanner } from "./actions";

export function BannerForm({ image }: { image: string | null }) {
  const [state, action] = useActionState(updateBanner, undefined);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setClientError(undefined);
    try {
      // 3:1 mittig zugeschnitten, 1500 × 500 reicht auch für große Handys
      const { blob } = await resizeImage(file, { maxEdge: 1500, aspect: 3, maxBytes: 600_000 });
      setPreview(URL.createObjectURL(blob));
      const fd = new FormData();
      fd.set("banner", blob, "banner.jpg");
      startTransition(() => action(fd));
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Das Bild ließ sich nicht verarbeiten.");
    }
  }

  const shown = isPending && preview ? preview : image;
  const error = clientError ?? state?.error;

  return (
    <div className="mb-6">
      <p className="mb-1.5 text-sm font-medium">Banner</p>
      <div className={`overflow-hidden rounded-xl ${isPending ? "opacity-60" : ""}`}>
        <ProfileBanner image={shown} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={isPending}
          className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isPending ? "Wird hochgeladen …" : image ? "Banner ändern" : "Banner hinzufügen"}
        </button>
        {image && !isPending && (
          <button
            type="button"
            onClick={() => startTransition(() => removeBanner())}
            className="text-sm text-muted hover:text-danger"
          >
            Banner entfernen
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">Wird mittig auf 3:1 zugeschnitten.</p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-label="Banner auswählen"
      />
      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}
    </div>
  );
}
