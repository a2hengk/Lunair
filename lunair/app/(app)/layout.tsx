import { NavigationTracker } from "@/components/back-button";
import { BottomNav } from "@/components/bottom-nav";
import { StickersProvider } from "@/components/stickers-context";
import { requireUser } from "@/lib/session";
import { getAllStickers } from "@/lib/stickers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const stickers = (await getAllStickers()).map(({ id, name, path }) => ({ id, name, path }));

  return (
    <>
      <div className="mx-auto min-h-dvh w-full max-w-md pt-[env(safe-area-inset-top)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <StickersProvider stickers={stickers}>{children}</StickersProvider>
      </div>
      <BottomNav username={me.username ?? ""} />
      <NavigationTracker />
    </>
  );
}
