"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-[var(--border)] bg-[var(--card)]/70 backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 md:flex md:items-center md:justify-between">
        <p className="text-xs text-[var(--muted)]">
          © 2025 <span className="font-medium text-[var(--fg)]">XBay Inc.</span>
          {" "}•{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-[var(--accent)]"
          >
            Privacy Policy
          </Link>
        </p>

        {/* Optional secondary links (keep/comment as you like) */}
        <nav
          aria-label="Footer"
          className="mt-3 flex gap-4 text-xs text-[var(--muted)] md:mt-0"
        >
          {/* <Link href="/security" className="hover:text-[var(--accent)]">Security</Link>
          <Link href="/terms" className="hover:text-[var(--accent)]">Terms</Link>
          <Link href="/contact" className="hover:text-[var(--accent)]">Contact</Link> */}
        </nav>
      </div>
    </footer>
  );
}
