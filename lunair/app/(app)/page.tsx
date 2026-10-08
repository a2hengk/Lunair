import Link from "next/link";
import { asc, ne } from "drizzle-orm";
import { Avatar } from "@/components/avatar";
import { Moon, Wordmark } from "@/components/moon";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function HomePage() {
  const me = await requireUser();

  const others = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username,
      image: schema.user.image,
    })
    .from(schema.user)
    .where(ne(schema.user.id, me.id))
    .orderBy(asc(schema.user.name));

  const firstName = (name: string) => name.trim().split(/\s+/)[0];

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <Wordmark />
        <Link href="/settings" className="rounded-lg p-1.5 text-muted hover:text-ink" aria-label="Einstellungen">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </Link>
      </header>

      {/* Story-Leiste: Ringe in Mondgelb kommen mit dem Stories-Feature */}
      <section aria-label="Stories" className="border-b border-line">
        <ul className="flex gap-4 overflow-x-auto px-4 pt-1 pb-4 [scrollbar-width:none]">
          <li className="w-[4.5rem] shrink-0 text-center">
            <span
              className="relative mx-auto block w-fit rounded-full border-2 border-dashed border-line p-0.5 opacity-80"
              title="Stories kommen bald"
            >
              <Avatar name={me.name} seed={me.username ?? me.id} image={me.image} />
              <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full border-2 border-sky bg-moon text-sm font-bold text-[#161b33]">
                +
              </span>
            </span>
            <span className="mt-1.5 block truncate text-xs text-muted">Deine Story</span>
          </li>
          {others.map((u) => (
            <li key={u.id} className="w-[4.5rem] shrink-0 text-center">
              <Link href={`/u/${u.username}`} className="block">
                <span className="mx-auto block w-fit rounded-full border-2 border-transparent p-0.5">
                  <Avatar name={u.name} seed={u.username ?? u.id} image={u.image} />
                </span>
                <span className="mt-1.5 block truncate text-xs">{firstName(u.name)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Feed: Posts kommen im nächsten Schritt */}
      <section aria-label="Beiträge" className="px-6 py-16 text-center">
        <Moon className="mx-auto size-10 text-moon" />
        <h1 className="mt-4 font-display text-2xl">Noch ist es ruhig hier</h1>
        {others.length === 0 ? (
          <>
            <p className="mx-auto mt-2 max-w-xs text-muted">
              Du bist bisher allein in lunair. Lad deine Freunde ein, dann füllt sich der Feed.
            </p>
            <Link
              href="/settings#einladen"
              className="mt-6 inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-sky"
            >
              Freunde einladen
            </Link>
          </>
        ) : (
          <p className="mx-auto mt-2 max-w-xs text-muted">
            Sobald jemand ein Foto oder einen Text postet, steht es hier – das Neueste oben.
          </p>
        )}
      </section>
    </>
  );
}
