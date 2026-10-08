import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Einladung" };

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  if (await getSession()) redirect("/");
  const { code } = await params;

  const [invite] = await db
    .select({
      expiresAt: schema.invites.expiresAt,
      inviterName: schema.user.name,
    })
    .from(schema.invites)
    .leftJoin(schema.user, eq(schema.user.id, schema.invites.createdBy))
    .where(and(eq(schema.invites.code, code), isNull(schema.invites.usedBy)))
    .limit(1);

  const valid = invite && (!invite.expiresAt || invite.expiresAt > new Date());

  if (!valid) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl">Diese Einladung gilt nicht mehr</h1>
        <p className="text-muted">
          Der Link ist abgelaufen oder wurde schon benutzt. Frag nach einem neuen.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-1 font-display text-2xl">
        {invite.inviterName ? `${invite.inviterName} hat dich eingeladen` : "Du bist eingeladen"}
      </h1>
      <p className="mb-6 text-muted">Leg deinen Account an, dann bist du drin.</p>
      <SignUpForm code={code} />
    </>
  );
}
