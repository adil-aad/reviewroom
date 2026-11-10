import ProjectList from "./ProjectList";
import { projects } from "./data";

export default function ProjectsPage() {
  return (
    <main id="main-content" className="page">
      <h1>Projects</h1>
      <p className="lead">Sample projects in your review workspace.</p>
      <ProjectList projects={projects} />
    </main>
  );
}
