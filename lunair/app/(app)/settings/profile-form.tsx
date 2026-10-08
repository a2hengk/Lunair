"use client";

import { useActionState, useState } from "react";
import { Field, FormError, SubmitButton } from "@/components/form";
import { updateProfile } from "./actions";

export function ProfileForm({ name, bio }: { name: string; bio: string }) {
  const [state, action] = useActionState(updateProfile, undefined);
  const [bioLength, setBioLength] = useState(bio.length);

  return (
    <form action={action} className="space-y-4">
      <Field label="Name" name="name" defaultValue={name} required maxLength={40} autoComplete="given-name" />
      <label className="block">
        <span className="mb-1.5 flex justify-between text-sm">
          <span className="font-medium">Bio</span>
          <span className={bioLength > 160 ? "text-danger" : "text-muted"}>{bioLength}/160</span>
        </span>
        <textarea
          name="bio"
          defaultValue={bio}
          rows={3}
          maxLength={160}
          onChange={(e) => setBioLength(e.target.value.length)}
          placeholder="Was machst du gerade so?"
          className="block w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-dusk focus:outline-none"
        />
      </label>
      <FormError message={state?.error} />
      {state?.saved && (
        <p role="status" className="text-sm text-muted">
          Profil gespeichert.
        </p>
      )}
      <SubmitButton pendingText="Wird gespeichert …">Profil speichern</SubmitButton>
    </form>
  );
}
