import type { Metadata, Viewport } from "next";
import { Archivo, Public_Sans, JetBrains_Mono } from "next/font/google";
import { PlanProvider } from "@/lib/store";
import { ProfileProvider } from "@/lib/profile";
import TabBar from "@/components/TabBar";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "P4E Floor", statusBarStyle: "black-translucent" },
  title: "P4E Floor — Fall Job Fair 2026",
  description:
    "All 160 employers at the P4E Fall Job Fair, on the real floorplan. Filter, build your route, and walk the floor once.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EFF1EC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1014" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <ProfileProvider>
          <PlanProvider>
            {children}
            <TabBar />
          </PlanProvider>
          <RegisterSW />
        </ProfileProvider>
      </body>
    </html>
  );
}
