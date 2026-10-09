/**
 * Läuft im Browser: verkleinert Fotos vor dem Upload und schreibt sie als JPEG neu.
 * Nebeneffekt, gewollt: EXIF-Daten (inkl. GPS-Ort) fliegen dabei raus.
 */

type Options = {
  /** längste Kante in px */
  maxEdge: number;
  /** quadratisch mittig zuschneiden (Profilbild) */
  square?: boolean;
  /** Obergrenze pro Bild; wird notfalls mit niedrigerer Qualität erreicht */
  maxBytes?: number;
};

export type ResizedImage = { blob: Blob; width: number; height: number };

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // respektiert die EXIF-Ausrichtung (Hochkant-Fotos vom Handy)
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", quality),
  );
}

export async function resizeImage(file: File, { maxEdge, square = false, maxBytes = 950_000 }: Options) {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    throw new Error(`„${file.name}“ lässt sich nicht öffnen. Ist das ein Foto?`);
  }

  const srcW = source.width;
  const srcH = source.height;

  // Zuschnitt (nur bei square) und Zielgröße berechnen
  const cropSize = Math.min(srcW, srcH);
  const sx = square ? (srcW - cropSize) / 2 : 0;
  const sy = square ? (srcH - cropSize) / 2 : 0;
  const sw = square ? cropSize : srcW;
  const sh = square ? cropSize : srcH;
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const width = Math.round(sw * scale);
  const height = Math.round(sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Dein Browser kann keine Bilder bearbeiten.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  if ("close" in source) source.close();

  let blob = await toBlob(canvas, 0.85);
  for (const q of [0.75, 0.65, 0.55]) {
    if (blob.size <= maxBytes) break;
    blob = await toBlob(canvas, q);
  }

  // Immer noch zu groß (sehr detailreiche Fotos): Auflösung schrittweise runter.
  let w = width;
  let h = height;
  while (blob.size > maxBytes && Math.max(w, h) > 480) {
    w = Math.round(w * 0.8);
    h = Math.round(h * 0.8);
    const smaller = document.createElement("canvas");
    smaller.width = w;
    smaller.height = h;
    const sctx = smaller.getContext("2d")!;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(canvas, 0, 0, w, h);
    blob = await toBlob(smaller, 0.7);
  }
  return { blob, width: w, height: h } satisfies ResizedImage;
}
