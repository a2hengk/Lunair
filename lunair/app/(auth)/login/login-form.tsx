"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/form";
import { signIn } from "../actions";

export function LoginForm() {
  const [state, action] = useActionState(signIn, undefined);

  return (
    <form action={action} className="space-y-4">
      <Field label="Benutzername" name="username" defaultValue={state?.values?.username} autoComplete="username" autoCapitalize="none" required />
      <Field label="Passwort" name="password" type="password" autoComplete="current-password" required />
      <FormError message={state?.error} />
      <SubmitButton pendingText="Wird angemeldet …">Anmelden</SubmitButton>
    </form>
  );
}
