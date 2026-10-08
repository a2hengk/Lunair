"use client";

import { useId } from "react";
import { useFormStatus } from "react-dom";

export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className="block w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-dusk focus:outline-none"
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-ink px-4 py-3 text-base font-semibold text-sky transition-opacity disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
      {message}
    </p>
  );
}
