/** Speicher-Pfad → URL. Bilder gehen immer über die geschützte Route, nie direkt an den Speicher. */
export function mediaUrl(path: string) {
  return `/api/media/${path}`;
}
