import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { hasAnyUser } from "@/lib/setup";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  if (!(await hasAnyUser())) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl">Noch niemand da</h1>
        <p className="text-muted">lunair ist frisch aufgesetzt. Leg den ersten Account an, danach lädst du die anderen ein.</p>
        <Link href="/setup" className="block rounded-xl bg-ink px-4 py-3 text-center font-semibold text-sky">
          Ersten Account anlegen
        </Link>
      </div>
    );
  }

  return (
    <>
      <LoginForm />
      <p className="mt-auto pt-10 text-sm text-muted">
        Noch keinen Account? lunair geht nur mit Einladung – frag jemanden, der schon drin ist.
      </p>
    </>
  );
}
