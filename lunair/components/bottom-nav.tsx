"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function PetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="13" r="7" />
      <circle cx="9.5" cy="12" r=".9" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r=".9" fill="currentColor" stroke="none" />
      <path d="M10 15.2q2 1.6 4 0" strokeLinecap="round" />
      <path d="M13 6a2.5 2.5 0 1 1-2-3.5" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" strokeLinecap="round" />
    </svg>
  );
}

/** `petNeedsCare`: heute hat sich noch keiner ums Pet gekümmert → kleiner Mondpunkt. */
export function BottomNav({ username, petNeedsCare = false }: { username: string; petNeedsCare?: boolean }) {
  const pathname = usePathname();
  const profileHref = `/u/${username}`;

  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${active ? "text-ink" : "text-muted"}`;

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <Link href="/" className={item(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
          <HomeIcon />
          Start
        </Link>
        <Link href="/new" className={item(pathname === "/new")} aria-current={pathname === "/new" ? "page" : undefined}>
          <PlusIcon />
          Posten
        </Link>
        <Link href="/pet" className={item(pathname === "/pet")} aria-current={pathname === "/pet" ? "page" : undefined}>
          <span className="relative">
            <PetIcon />
            {petNeedsCare && (
              <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-surface bg-moon" />
            )}
          </span>
          Pet
          {petNeedsCare && <span className="sr-only"> (braucht heute noch Pflege)</span>}
        </Link>
        <Link
          href={profileHref}
          className={item(pathname === profileHref)}
          aria-current={pathname === profileHref ? "page" : undefined}
        >
          <ProfileIcon />
          Profil
        </Link>
      </div>
    </nav>
  );
}
