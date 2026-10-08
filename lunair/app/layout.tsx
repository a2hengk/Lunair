import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import "@fontsource/young-serif/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "lunair", template: "%s · lunair" },
  description: "Euer Tagebuch unter Freunden.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9ecf5" },
    { media: "(prefers-color-scheme: dark)", color: "#10142a" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
