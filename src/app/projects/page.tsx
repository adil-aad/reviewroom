import ProjectList from "./ProjectList";

const projects = [
  {
    id: "brand-identity",
    name: "Brand identity",
    client: "Maji Studio",
    status: "Awaiting feedback",
  },
  {
    id: "website-homepage",
    name: "Website homepage",
    client: "Northline",
    status: "Approved",
  },
];

export default function ProjectsPage() {
  return (
    <main id="main-content" className="page">
      <h1>Projects</h1>
      <p className="lead">Sample projects in your review workspace.</p>
      <ProjectList projects={projects} />
    </main>
  );
}
