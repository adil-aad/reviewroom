import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjects } from "../store";
import { getProjectFeedback } from "../feedback-store";
import FeedbackForm from "./FeedbackForm";
import ProjectStatusForm from "./ProjectStatusForm";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projects = await getProjects();
  const project = projects.find((project) => project.id === id);

  if (!project) {
    notFound();
  }

  const feedback = await getProjectFeedback(project.id);

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
      <ProjectStatusForm key={project.id} projectId={project.id} status={project.status} />

      <section className="feedback-section" aria-labelledby="feedback-heading">
        <h2 id="feedback-heading">Feedback</h2>
        <p className="lead">Share what works and what needs another pass.</p>
        <FeedbackForm key={project.id} projectId={project.id} />

        <h3 className="feedback-history-heading">Feedback history</h3>
        <p className="feedback-download">
          <a href={`/projects/${project.id}/feedback`} download>Download feedback</a>
        </p>
        {feedback.length === 0 ? (
          <p className="lead">No feedback yet. Add the first note above.</p>
        ) : (
          <ol className="feedback-list" aria-label="Feedback history">
            {feedback.map((entry) => (
              <li key={entry.id}>
                <div className="feedback-meta">
                  <strong>{entry.author}</strong>
                  <time dateTime={entry.createdAt}>
                    {new Date(entry.createdAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    })}{" "}
                    UTC
                  </time>
                </div>
                <p className="feedback-message">{entry.message}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
