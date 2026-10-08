"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/form";
import { signUpWithInvite } from "../../actions";

export function SignUpForm({ code }: { code: string }) {
  const [state, action] = useActionState(signUpWithInvite, undefined);
  const v = state?.values;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <Field
        label="Name"
        name="name"
        defaultValue={v?.name}
        autoComplete="given-name"
        hint="So sehen dich die anderen."
        required
        maxLength={40}
      />
      <Field
        label="Benutzername"
        name="username"
        defaultValue={v?.username}
        autoComplete="username"
        autoCapitalize="none"
        hint="Zum Anmelden und für dein Profil, z. B. lunas"
        required
        minLength={3}
        maxLength={24}
        pattern="[a-zA-Z0-9_.]{3,24}"
      />
      <Field
        label="E-Mail"
        name="email"
        type="email"
        defaultValue={v?.email}
        autoComplete="email"
        hint="Nur falls du dein Passwort vergisst."
        required
      />
      <Field label="Passwort" name="password" type="password" autoComplete="new-password" hint="Mindestens 8 Zeichen." required minLength={8} />
      <FormError message={state?.error} />
      <SubmitButton pendingText="Account wird angelegt …">Account anlegen</SubmitButton>
    </form>
  );
}
