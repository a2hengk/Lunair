import Link from "next/link";
import { Moon } from "@/components/moon";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-sm px-6 py-24 text-center">
      <Moon className="mx-auto size-10 text-moon" />
      <h1 className="mt-4 font-display text-2xl">Hier ist nichts</h1>
      <p className="mt-2 text-muted">Die Seite oder das Profil gibt es nicht.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-dusk">
        Zur Startseite
      </Link>
    </main>
  );
}
