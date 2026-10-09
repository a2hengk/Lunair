import type { Metadata } from "next";
import { ComposeForm } from "./compose-form";

export const metadata: Metadata = { title: "Neuer Beitrag" };

export default function NewPostPage() {
  return <ComposeForm />;
}
