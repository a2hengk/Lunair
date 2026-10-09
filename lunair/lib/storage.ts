import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { del, get, put } from "@vercel/blob";

/**
 * Bild-Speicher mit zwei Treibern:
 * - Vercel Blob (privater Store), sobald der Store mit dem Projekt verbunden ist
 * - lokales Dateisystem (.data/uploads) für die Entwicklung
 * Ausgeliefert wird immer über /api/media/…, das den Login prüft.
 */

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Bilder-Speicher ist nicht eingerichtet (Vercel Blob fehlt).");
  }
}

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Pfade sehen immer so aus: avatars/<userId>/<uuid>.jpg oder posts/<userId>/<uuid>.jpg */
export const MEDIA_PATH = /^(avatars|posts)\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(jpg|png|webp)$/;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function localFile(pathname: string) {
  return path.join(LOCAL_DIR, ...pathname.split("/"));
}

export async function saveMedia(pathname: string, bytes: Uint8Array, contentType: string) {
  if (useBlob) {
    await put(pathname, Buffer.from(bytes), {
      access: "private",
      contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: ONE_YEAR,
    });
    return;
  }
  if (process.env.VERCEL) throw new StorageNotConfiguredError();

  const file = localFile(pathname);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

export async function deleteMedia(pathnames: string[]) {
  if (pathnames.length === 0) return;
  try {
    if (useBlob) {
      await del(pathnames);
    } else if (!process.env.VERCEL) {
      await Promise.all(pathnames.map((p) => unlink(localFile(p)).catch(() => {})));
    }
  } catch (err) {
    // Aufräumen darf nie den eigentlichen Vorgang kaputt machen.
    console.error("[storage] Löschen fehlgeschlagen", pathnames, err);
  }
}

/** Liefert das Bild als Response aus. Pfade sind einmalig, deshalb lange cachebar. */
export async function mediaResponse(pathname: string, ifNoneMatch: string | null): Promise<Response> {
  const ext = pathname.split(".").pop() ?? "jpg";
  const baseHeaders = {
    "Cache-Control": `private, max-age=${ONE_YEAR}, immutable`,
    "X-Content-Type-Options": "nosniff",
  };

  if (useBlob) {
    const result = await get(pathname, { access: "private", ifNoneMatch: ifNoneMatch ?? undefined });
    if (!result) return new Response("Nicht gefunden", { status: 404 });
    if (result.statusCode === 304) {
      return new Response(null, { status: 304, headers: { ...baseHeaders, ETag: result.blob.etag } });
    }
    return new Response(result.stream, {
      headers: {
        ...baseHeaders,
        "Content-Type": result.blob.contentType,
        "Content-Length": String(result.blob.size),
        ETag: result.blob.etag,
      },
    });
  }

  const file = localFile(pathname);
  const info = await stat(file).catch(() => null);
  if (!info) return new Response("Nicht gefunden", { status: 404 });
  const etag = `"${info.size}-${Math.floor(info.mtimeMs)}"`;
  if (ifNoneMatch === etag) return new Response(null, { status: 304, headers: { ...baseHeaders, ETag: etag } });

  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: {
      ...baseHeaders,
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(info.size),
      ETag: etag,
    },
  });
}
