import { Wordmark } from "@/components/moon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 pt-[max(4rem,env(safe-area-inset-top))] pb-10">
      <div className="mb-10">
        <Wordmark size="lg" />
        <p className="mt-3 text-muted">Euer Tagebuch unter Freunden.</p>
      </div>
      {children}
    </main>
  );
}
