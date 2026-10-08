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
  sm: "size-9 text-sm",
  md: "size-16 text-xl",
  lg: "size-24 text-3xl",
} as const;

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
    // Avatar-Upload kommt mit dem R2-Schritt; bis dahin Initialen.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`${cls} object-cover`} />;
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
