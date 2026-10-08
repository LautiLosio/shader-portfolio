import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { profile } from "@/lib/profile";
import { translations } from "@/lib/translations";
import "./globals.css";
const atkinson = localFont({
  src: [
    { path: "./fonts/AtkinsonHyperlegible-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/AtkinsonHyperlegible-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/AtkinsonHyperlegible-Italic.ttf", weight: "400", style: "italic" },
    { path: "./fonts/AtkinsonHyperlegible-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-atkinson", display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://lauti.dev"),
  title: `${profile.name} | Portfolio`,
  description: translations.en.introduction,
  robots: { index: profile.name !== "Tu nombre", follow: profile.name !== "Tu nombre" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body className={atkinson.variable}>{children}</body></html>;
}
