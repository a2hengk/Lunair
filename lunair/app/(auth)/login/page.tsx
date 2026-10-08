import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <>
      <LoginForm />
      <p className="mt-auto pt-10 text-sm text-muted">
        Noch keinen Account? lunair geht nur mit Einladung – frag jemanden, der schon drin ist.
      </p>
    </>
  );
}
