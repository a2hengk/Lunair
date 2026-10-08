import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasAnyUser } from "@/lib/setup";
import { SignUpForm } from "../invite/[code]/sign-up-form";

export const metadata: Metadata = { title: "Einrichten" };

// Nur solange es noch keinen einzigen Account gibt.
export default async function SetupPage() {
  if (await getSession()) redirect("/");
  if (await hasAnyUser()) redirect("/login");

  return (
    <>
      <h1 className="mb-1 font-display text-2xl">Ersten Account anlegen</h1>
      <p className="mb-6 text-muted">Danach geht es nur noch mit Einladung rein.</p>
      <SignUpForm />
    </>
  );
}
