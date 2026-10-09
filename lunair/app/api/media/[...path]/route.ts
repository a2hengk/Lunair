import { auth } from "@/lib/auth";
import { MEDIA_PATH, mediaResponse } from "@/lib/storage";

// Bilder nur für eingeloggte Mitglieder.
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Nicht angemeldet", { status: 401 });

  const { path } = await params;
  const pathname = path.join("/");
  if (!MEDIA_PATH.test(pathname)) return new Response("Nicht gefunden", { status: 404 });

  return mediaResponse(pathname, request.headers.get("if-none-match"));
}
