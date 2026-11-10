import Link from "next/link";
import { connection } from "next/server";
import ProjectList from "./ProjectList";
import { getProjects } from "./store";

export default async function ProjectsPage() {
  await connection();
  const projects = await getProjects();

  return (
    <main id="main-content" className="page">
      <h1>Projects</h1>
      <p className="lead">Your project review workspace.</p>
      <Link href="/projects/new" className="button">
        New project
      </Link>
      <ProjectList projects={projects} />
    </main>
  );
}
