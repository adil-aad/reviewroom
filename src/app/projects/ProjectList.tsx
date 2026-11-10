"use client";

import { useState } from "react";

type Project = {
  id: string;
  name: string;
  client: string;
  status: string;
};

export default function ProjectList({ projects }: { projects: Project[] }) {
  const [status, setStatus] = useState("All");

  const visibleProjects = projects.filter(
    (project) => status === "All" || project.status === status,
  );

  return (
    <>
      <div className="project-filter">
        <label htmlFor="project-status">Status</label>
        <select
          id="project-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Awaiting feedback">Awaiting feedback</option>
          <option value="Approved">Approved</option>
        </select>
      </div>

      {visibleProjects.length === 0 ? (
        <p className="lead">No projects match this status.</p>
      ) : (
        <ul className="project-list">
          {visibleProjects.map((project) => (
            <li key={project.id}>
              <div>
                <h2>{project.name}</h2>
                <p>{project.client}</p>
              </div>
              <span className="status">{project.status}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
