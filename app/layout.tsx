import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
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

export default async function CapraStarterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The CSP nonce is generated per-request in middleware.ts and forwarded via
  // this request header so 'strict-dynamic' script-src trusts this tag.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} ${styles.root}`}
      >
        <UserNav />
        {children}
        <Script src="https://capralens.com/capralens.js" integrity="sha384-5MwE1nTjMxFr0AsDD0IjVfp3uwwBt3TNL/P8ySZKR+vMk8XqRvVAdHmfYBzfXyVt" crossOrigin="anonymous" data-property="caprastarter" data-endpoint="https://capralens.com/api/capralens/collect" strategy="afterInteractive" nonce={nonce} />
      </body>
    </html>
  );
}
