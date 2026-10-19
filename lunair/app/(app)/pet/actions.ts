"use server";

import { revalidatePath } from "next/cache";
import { type PetActionType, getPet, recordPetAction } from "@/lib/pet";
import { requireUser } from "@/lib/session";

export type PetActionResult = { error?: string };

/** Füttern oder streicheln. */
export async function interactWithPet(type: PetActionType): Promise<PetActionResult> {
  const me = await requireUser();
  if (type !== "feed" && type !== "pet") return { error: "Das ging nicht." };

  const current = await getPet();

  const updated = await recordPetAction(me.id, type);

  if (!updated) {
    return {
      error: type === "feed" ? `${current.name} ist noch satt.` : `${current.name} ist gerade rundum zufrieden.`,
    };
  }

  revalidatePath("/", "layout");
  return {};
}
