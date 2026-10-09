import { mediaUrl } from "@/lib/media-url";

/** Ohne eigenes Bild: ruhiger Dämmerungs-Verlauf mit einer Mondsichel, passend zur Marke. */
export function ProfileBanner({ image }: { image?: string | null }) {
  if (image) {
    const src = /^(blob:|https?:|\/)/.test(image) ? image : mediaUrl(image);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="aspect-[3/1] w-full bg-line object-cover" />;
  }
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[3/1] w-full overflow-hidden bg-[linear-gradient(160deg,var(--dusk)_0%,#2a3156_55%,#161b33_100%)]"
    >
      <svg viewBox="0 0 24 24" className="absolute top-[18%] right-[12%] size-[18%] text-moon/80">
        <path d="M15.5 3.2a9 9 0 1 0 5.3 13.6A7.5 7.5 0 0 1 15.5 3.2Z" fill="currentColor" />
      </svg>
    </div>
  );
}
