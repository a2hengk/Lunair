import { BottomNav } from "@/components/bottom-nav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();

  return (
    <>
      <div className="mx-auto min-h-dvh w-full max-w-md pt-[env(safe-area-inset-top)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav username={me.username ?? ""} />
    </>
  );
}
