import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { PostGrid } from "@/components/post-grid";
import { ProfileBanner } from "@/components/profile-banner";
import { db, schema } from "@/lib/db";
import { countUserPosts, getUserPosts } from "@/lib/posts";
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
  const [posts, postCount] = await Promise.all([getUserPosts(profile.id, me.id), countUserPosts(profile.id)]);

  return (
    <>
      <header className="flex items-center gap-1 px-4 pt-2 pb-2">
        <BackButton fallback="/" />
        <span className="min-w-0 flex-1 truncate font-medium">@{profile.displayUsername ?? profile.username}</span>
        {isMe && (
          <Link
            href="/settings"
            aria-label="Einstellungen"
            className="-mr-2 grid size-10 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </Link>
        )}
      </header>

      <ProfileBanner image={profile.bannerImage} />

      <section className="px-4 pb-6">
        <div className="relative -mt-12 w-fit rounded-full ring-4 ring-sky">
          <Avatar name={profile.name} seed={profile.username ?? profile.id} image={profile.image} size="lg" />
        </div>
        <h1 className="mt-3 font-display text-3xl leading-tight break-words">{profile.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {postCount === 1 ? "1 Beitrag" : `${postCount} Beiträge`} · dabei seit {joined.format(profile.createdAt)}
        </p>

        {profile.bio ? (
          <p className="mt-3 max-w-prose whitespace-pre-line">{profile.bio}</p>
        ) : (
          isMe && <p className="mt-3 text-muted">Noch keine Bio. Erzähl den anderen kurz, was bei dir los ist.</p>
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

      <section aria-label="Beiträge" className="border-t border-line">
        {posts.length > 0 ? (
          <PostGrid posts={posts} />
        ) : isMe ? (
          <div className="px-6 py-14 text-center">
            <p className="text-muted">Du hast noch nichts gepostet.</p>
            <Link href="/new" className="mt-4 inline-block font-semibold text-dusk">
              Ersten Beitrag schreiben
            </Link>
          </div>
        ) : (
          <p className="px-6 py-14 text-center text-muted">{profile.name} hat noch nichts gepostet.</p>
        )}
      </section>
    </>
  );
}
