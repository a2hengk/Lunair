import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Moon } from "@/components/moon";
import { getPet, getRecentPetActions, petState } from "@/lib/pet";
import { requireUser } from "@/lib/session";
import { timeAgo } from "@/lib/time-ago";
import { PetPlayground } from "./pet-playground";

export default async function PetPage() {
  const me = await requireUser();
  const [row, actions] = await Promise.all([getPet(), getRecentPetActions()]);
  const state = petState(row);
  const now = new Date();

  const firstName = (name: string) => name.trim().split(/\s+/)[0];
  const days = (n: number) => (n === 1 ? "1 Tag" : `${n} Tage`);

  let streakHint: string;
  if (state.caredToday) streakHint = `Heute hat sich schon jemand um ${state.name} gekümmert.`;
  else if (state.streak > 0) streakHint = "Heute war noch keiner da – sonst reißt die Streak um Mitternacht.";
  else streakHint = `Füttert oder streichelt ${state.name}, um eine Streak zu starten.`;

  return (
    <>
      <header className="px-4 pt-4 pb-2">
        <h1 className="font-display text-2xl">{state.name}</h1>
        <p className="text-sm text-muted">Euer gemeinsames Haustier – einer muss sich jeden Tag kümmern.</p>
      </header>

      <PetPlayground state={state} />

      <section aria-label="Streak" className="mx-4 mt-6 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <Moon className={`size-8 ${state.streak > 0 ? "text-moon" : "text-line"}`} />
          <div>
            <p className="font-display text-xl leading-tight">{days(state.streak)}</p>
            <p className="text-xs text-muted">Rekord: {days(state.bestStreak)}</p>
          </div>
          {state.caredToday && (
            <span className="ml-auto rounded-full bg-moon/20 px-2.5 py-1 text-xs font-semibold">heute ✓</span>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">{streakHint}</p>
      </section>

      <section aria-label="Zuletzt" className="px-4 pt-6 pb-4">
        <h2 className="text-sm font-semibold text-muted">Zuletzt</h2>
        {actions.length > 0 ? (
          <ul className="mt-2 divide-y divide-line">
            {actions.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <Link href={`/u/${a.username}`} className="shrink-0">
                  <Avatar name={a.userName} seed={a.username ?? a.userId} image={a.userImage} size="xs" />
                </Link>
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{a.userId === me.id ? "Du" : firstName(a.userName)}</span>{" "}
                  {a.userId === me.id
                    ? a.type === "feed"
                      ? "hast gefüttert"
                      : "hast gestreichelt"
                    : a.type === "feed"
                      ? "hat gefüttert"
                      : "hat gestreichelt"}{" "}
                  {a.type === "feed" ? "🍙" : "💛"}
                </p>
                <time dateTime={a.createdAt.toISOString()} className="shrink-0 text-xs text-muted">
                  {timeAgo(a.createdAt, now)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Noch nichts passiert. Sei die erste Person.</p>
        )}
      </section>
    </>
  );
}
