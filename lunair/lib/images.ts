import { randomUUID } from "node:crypto";
import { imageSize } from "image-size";
import { saveMedia } from "./storage";

/** Der Browser verkleinert vorher auf max. 1600 px; das hier ist nur die Obergrenze. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED: Record<string, { ext: string; contentType: string }> = {
  jpg: { ext: "jpg", contentType: "image/jpeg" },
  png: { ext: "png", contentType: "image/png" },
  webp: { ext: "webp", contentType: "image/webp" },
};

export class InvalidImageError extends Error {}

export type StoredImage = { path: string; width: number; height: number };

/**
 * Prüft die echten Bytes (nicht den vom Browser behaupteten Typ),
 * liest die Maße aus und legt das Bild unter einem zufälligen Pfad ab.
 */
export async function storeImage(file: File, folder: "avatars" | "banners" | "posts", userId: string): Promise<StoredImage> {
  if (file.size === 0) throw new InvalidImageError("Ein Bild ist leer.");
  if (file.size > MAX_IMAGE_BYTES) throw new InvalidImageError("Ein Bild ist zu groß (max. 2 MB).");

  const bytes = new Uint8Array(await file.arrayBuffer());
  let info: ReturnType<typeof imageSize>;
  try {
    info = imageSize(bytes);
  } catch {
    throw new InvalidImageError("Das ist kein Bild, das lunair lesen kann.");
  }

  const type = info.type ? ALLOWED[info.type] : undefined;
  if (!type || !info.width || !info.height) {
    throw new InvalidImageError("Nur JPEG, PNG oder WebP.");
  }

  const path = `${folder}/${userId}/${randomUUID()}.${type.ext}`;
  await saveMedia(path, bytes, type.contentType);
  return { path, width: info.width, height: info.height };
}
