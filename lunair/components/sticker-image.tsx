import { mediaUrl } from "@/lib/media-url";
import type { StickerInfo } from "@/lib/reactions";

/**
 * Feste Größen statt Originalgröße: Sticker sind immer klein.
 * xs = in Reaktions-Zählern, sm = im Picker, md = als Kommentar.
 */
const SIZES = { xs: "size-5", sm: "size-9", md: "size-24" } as const;

export function StickerImage({
  sticker,
  size,
  decorative = false,
}: {
  sticker: StickerInfo;
  size: keyof typeof SIZES;
  decorative?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(sticker.path)}
      alt={decorative ? "" : `Sticker: ${sticker.name}`}
      title={sticker.name}
      width={256}
      height={256}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`${SIZES[size]} shrink-0 object-contain`}
    />
  );
}
