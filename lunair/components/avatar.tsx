import { mediaUrl } from "@/lib/media-url";

const TINTS = ["#c9d3f2", "#f2dfb0", "#d8c9ef", "#bfe0dc", "#f0c9cf", "#cfe3bf"];

function tintFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

const SIZES = {
  xs: "size-8 text-xs",
  sm: "size-9 text-sm",
  md: "size-16 text-xl",
  lg: "size-24 text-3xl",
} as const;

/** `image` ist ein Speicher-Pfad (user.image) oder eine fertige URL (z. B. Vorschau beim Hochladen). */
export function Avatar({
  name,
  seed,
  image,
  size = "md",
}: {
  name: string;
  seed: string;
  image?: string | null;
  size?: keyof typeof SIZES;
}) {
  const cls = `${SIZES[size]} shrink-0 rounded-full`;
  if (image) {
    const src = /^(blob:|https?:|\/)/.test(image) ? image : mediaUrl(image);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${cls} bg-line object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${cls} grid place-items-center font-display text-[#161b33]`}
      style={{ backgroundColor: tintFor(seed) }}
    >
      {initials(name)}
    </span>
  );
}
