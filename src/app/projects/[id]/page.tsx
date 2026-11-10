import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "../data";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projects.find((project) => project.id === id);

  if (!project) {
    notFound();
  }

  return (
    <main id="main-content" className="page">
      <Link href="/projects">Back to projects</Link>
      <h1 className="project-title">{project.name}</h1>
      <p className="lead">{project.description}</p>
      <dl className="project-details">
        <dt>Client</dt>
        <dd>{project.client}</dd>
        <dt>Status</dt>
        <dd>{project.status}</dd>
      </dl>
    </main>
  );
}
