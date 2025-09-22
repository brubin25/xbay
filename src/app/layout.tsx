// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import Brand from "@/components/Brand";
import Link from "next/link";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Make complex healthcare data simple.",
  description: "Explore healthcare data with a modern, secure, high-performance UI.",
  // Favicon / tab icon using your logo
  icons: {
    icon: "/brand/xbay.png",
    shortcut: "/brand/xbay.png",
    apple: "/brand/xbay.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* FOUC-free theme bootstrap (runs before hydration) */}
        <Script id="xbay-theme-bootstrap" strategy="beforeInteractive">{`
(function () {
  try {
    var saved = localStorage.getItem('xbay-theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    var cl = document.documentElement.classList;
    if (dark) cl.add('dark'); else cl.remove('dark');
  } catch (e) {}
})();
        `}</Script>
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <div className="min-h-screen flex flex-col">
          {/* Top App Bar */}
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/85 backdrop-blur">
            <div className="container-app h-14 flex items-center justify-between">
              <Brand />
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="container-app py-6 flex-1">{children}</main>

          {/* Global footer */}
          <footer
            role="contentinfo"
            className="mt-auto border-t border-[var(--border)] bg-[var(--card)]/75 backdrop-blur"
          >
            <div className="container-app flex items-center justify-between py-4">
              <p className="text-xs text-[var(--muted)]">
                © 2025 <span className="font-medium text-[var(--fg)]">XBay Inc.</span>
              </p>
              <nav aria-label="Footer" className="text-xs">
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 text-[var(--muted)] hover:text-[var(--accent)]"
                >
                  Privacy Policy
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
