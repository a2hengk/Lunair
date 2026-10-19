"use client";

import { useState, useTransition } from "react";
import { PetCreature } from "@/components/pet-creature";
import type { PetActionType, PetState } from "@/lib/pet";
import { interactWithPet } from "./actions";

const MOOD_TEXT: Record<PetState["mood"], string> = {
  happy: "ist glücklich",
  okay: "ist zufrieden",
  hungry: "hat Hunger",
  lonely: "will gestreichelt werden",
  sad: "ist traurig – keiner hat sich gekümmert",
};

type Burst = { id: number; emoji: string; dx: number; delay: number };

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted tabular-nums">{value} %</span>
      </div>
      <div
        className="mt-1 h-2.5 overflow-hidden rounded-full bg-line"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${value < 30 ? "bg-danger" : "bg-moon"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function PetPlayground({ state }: { state: PetState }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [hop, setHop] = useState(0);

  function act(type: PetActionType) {
    setError(null);
    startTransition(async () => {
      const result = await interactWithPet(type);
      if (result.error) {
        setError(result.error);
        return;
      }
      const emoji = type === "feed" ? "🍙" : "💛";
      const now = Date.now();
      setBursts(
        Array.from({ length: 5 }, (_, i) => ({ id: now + i, emoji, dx: (i - 2) * 22, delay: i * 90 })),
      );
      setHop((h) => h + 1);
    });
  }

  return (
    <section className="px-4">
      <div className="relative mx-auto w-fit">
        <div key={hop} className={hop ? "pet-hop" : "pet-bob"}>
          <PetCreature mood={state.mood} className="size-48" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
          {bursts.map((b) => (
            <span
              key={b.id}
              className="float-away absolute text-2xl"
              style={
                {
                  "--dx": `${b.dx}px`,
                  "--rise": "110px",
                  "--s": 1,
                  "--dur": "1.4s",
                  "--delay": `${b.delay}ms`,
                } as React.CSSProperties
              }
            >
              {b.emoji}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-muted">
        {state.name} {MOOD_TEXT[state.mood]}
      </p>

      <div className="mt-6 space-y-3">
        <Meter label="Satt" value={state.fullness} />
        <Meter label="Laune" value={state.love} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => act("feed")}
          disabled={isPending || !state.canFeed}
          className="rounded-xl bg-ink px-4 py-3 font-semibold text-sky disabled:opacity-40"
        >
          🍙 Füttern
        </button>
        <button
          type="button"
          onClick={() => act("pet")}
          disabled={isPending || !state.canPet}
          className="rounded-xl border border-line bg-surface px-4 py-3 font-semibold disabled:opacity-40"
        >
          💛 Streicheln
        </button>
      </div>

      <p className="mt-2 min-h-5 text-center text-sm text-muted" aria-live="polite">
        {error ??
          (!state.canFeed && !state.canPet
            ? `${state.name} ist rundum versorgt.`
            : !state.canFeed
              ? `${state.name} ist noch satt.`
              : !state.canPet
                ? `${state.name} ist gerade zufrieden.`
                : "")}
      </p>
    </section>
  );
}
