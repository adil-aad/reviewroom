import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <main id="main-content" className="page">
      <h1>Project not found</h1>
      <p className="lead">This project does not exist.</p>
      <Link href="/projects" className="button">
        Back to projects
      </Link>
    </main>
  );
}
