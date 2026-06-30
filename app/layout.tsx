import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import styles from "./layout.module.css";
import UserNav from "@/components/UserNav";

export const metadata: Metadata = {
  title: "CapraStarter",
  description: "Venture seed analysis and launch blueprint generator.",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export default function CapraStarterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} ${styles.root}`}
      >
        <UserNav />
        {children}
        <Script src="https://capralens.com/capralens.js" data-property="caprastarter" data-endpoint="https://capralens.com/api/capralens/collect" strategy="afterInteractive" />
      </body>
    </html>
  );
}
