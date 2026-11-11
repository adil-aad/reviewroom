"use client";

import Link from "next/link";

export default function ProjectsError({ retry }: { retry: () => void }) {
  return (
    <main id="main-content" className="page">
      <Link href="/">Back to home</Link>
      <h1 className="project-title">Could not load this page</h1>
      <p className="lead" role="alert">
        Something went wrong while opening your project workspace. Please try again.
      </p>
      <button type="button" className="button" onClick={() => retry()}>
        Try again
      </button>
    </main>
  );
}
