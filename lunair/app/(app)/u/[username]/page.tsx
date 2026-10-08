import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { Avatar } from "@/components/avatar";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";

type Props = { params: Promise<{ username: string }> };

const getProfile = cache(async (username: string) => {
  const [profile] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.username, decodeURIComponent(username).toLowerCase()))
    .limit(1);
  return profile;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  return { title: profile ? profile.name : "Profil" };
}

const joined = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });

export default async function ProfilePage({ params }: Props) {
  const me = await requireUser();
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const isMe = profile.id === me.id;

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="font-medium">@{profile.displayUsername ?? profile.username}</span>
        {isMe && (
          <Link href="/settings" className="text-sm text-muted hover:text-ink">
            Einstellungen
          </Link>
        )}
      </header>

      <section className="px-4 pt-4 pb-6">
        <div className="flex items-center gap-5">
          <Avatar name={profile.name} seed={profile.username ?? profile.id} image={profile.image} size="lg" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-tight break-words">{profile.name}</h1>
            <p className="mt-1 text-sm text-muted">Dabei seit {joined.format(profile.createdAt)}</p>
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-5 max-w-prose whitespace-pre-line">{profile.bio}</p>
        ) : (
          isMe && <p className="mt-5 text-muted">Noch keine Bio. Erzähl den anderen kurz, was bei dir los ist.</p>
        )}

        {isMe && (
          <Link
            href="/settings"
            className="mt-5 block rounded-xl border border-line bg-surface py-2.5 text-center font-medium"
          >
            Profil bearbeiten
          </Link>
        )}
      </section>

      <section aria-label="Beiträge" className="border-t border-line px-6 py-14 text-center">
        <p className="text-muted">
          {isMe ? "Deine Beiträge erscheinen hier als Raster." : `${profile.name} hat noch nichts gepostet.`}
        </p>
      </section>
    </>
  );
}
