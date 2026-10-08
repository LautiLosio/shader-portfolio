import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { profile } from "@/lib/profile";
import { translations } from "@/lib/translations";
import "./globals.css";
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
export const metadata: Metadata = {
  metadataBase: new URL("https://lauti.dev"),
  title: `${profile.name} | Portfolio`,
  description: translations.en.introduction,
  robots: { index: profile.name !== "Tu nombre", follow: profile.name !== "Tu nombre" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body className={manrope.variable}>{children}</body></html>;
}
