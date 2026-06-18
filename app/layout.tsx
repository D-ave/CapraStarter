import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrandStarter — AI Brand Kit Generator",
  description: "Generate a complete brand kit in seconds. Colors, taglines, fonts, and strategy — all powered by AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="container navbar-inner">
            <a href="/" className="navbar-brand">Brand<span>Starter</span></a>
            <div className="navbar-links">
              <a href="/#how-it-works" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "14px" }}>How it works</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
