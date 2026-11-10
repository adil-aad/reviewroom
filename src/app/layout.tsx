import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewRoom",
  description: "A place for freelancers and clients to review work together.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="site-header">
          <span className="wordmark">ReviewRoom</span>
          <nav aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
