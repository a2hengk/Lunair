import type { Metadata } from "next";
import { headers } from "next/headers";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { signOut } from "@/app/(auth)/actions";
import { BackButton } from "@/components/back-button";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createInvite } from "./actions";
import { AvatarForm } from "./avatar-form";
import { BannerForm } from "./banner-form";
import { CopyLink } from "./copy-link";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Einstellungen" };

const until = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long" });

export default async function SettingsPage() {
  const me = await requireUser();

  const openInvites = await db
    .select({ code: schema.invites.code, expiresAt: schema.invites.expiresAt })
    .from(schema.invites)
    .where(
      and(
        eq(schema.invites.createdBy, me.id),
        isNull(schema.invites.usedBy),
        gt(schema.invites.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(schema.invites.createdAt));

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  return (
    <div className="px-4 pt-3">
      <div className="mb-4 flex items-center gap-1">
        <BackButton fallback={`/u/${me.username}`} />
        <h1 className="font-display text-3xl">Einstellungen</h1>
      </div>

      <section aria-labelledby="profil" className="mb-10">
        <h2 id="profil" className="mb-4 text-lg font-semibold">
          Profil
        </h2>
        <AvatarForm name={me.name} seed={me.username ?? me.id} image={me.image} />
        <BannerForm image={me.bannerImage} />
        <p className="mb-4 text-sm text-muted">Benutzername: @{me.displayUsername ?? me.username}</p>
        <ProfileForm name={me.name} bio={me.bio ?? ""} />
      </section>

      <section id="einladen" aria-labelledby="einladen-titel" className="mb-10 scroll-mt-4">
        <h2 id="einladen-titel" className="mb-1 text-lg font-semibold">
          Freunde einladen
        </h2>
        <p className="mb-4 text-sm text-muted">Jeder Link gilt für eine Person und 7 Tage.</p>

        {openInvites.length > 0 && (
          <ul className="mb-4 divide-y divide-line rounded-xl border border-line bg-surface">
            {openInvites.map((inv) => (
              <li key={inv.code} className="flex items-center gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {host}/invite/{inv.code}
                  </p>
                  <p className="text-xs text-muted">gültig bis {until.format(inv.expiresAt!)}</p>
                </div>
                <CopyLink url={`${base}/invite/${inv.code}`} />
              </li>
            ))}
          </ul>
        )}

        <form action={createInvite}>
          <button type="submit" className="w-full rounded-xl border border-line bg-surface py-3 font-semibold">
            Neuen Einladungslink erstellen
          </button>
        </form>
      </section>

      <section className="mb-6 border-t border-line pt-6">
        <form action={signOut}>
          <button type="submit" className="font-medium text-danger">
            Abmelden
          </button>
        </form>
      </section>
    </div>
  );
}
