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
      <ul className="project-list">
        {projects.map((project) => (
          <li key={project.id}>
            <div>
              <h2>{project.name}</h2>
              <p>{project.client}</p>
            </div>
            <span className="status">{project.status}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
