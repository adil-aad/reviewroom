import Link from "next/link";
import NewProjectForm from "./NewProjectForm";

export default function NewProjectPage() {
  return (
    <main id="main-content" className="page">
      <Link href="/projects">Back to projects</Link>
      <h1 className="project-title">Create project</h1>
      <p className="lead">Add the work you want your client to review.</p>
      <NewProjectForm />
    </main>
  );
}
