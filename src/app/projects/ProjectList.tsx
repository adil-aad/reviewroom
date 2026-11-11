"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Project } from "./data";

export default function ProjectList({ projects }: { projects: Project[] }) {
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const status =
    requestedStatus === "Awaiting feedback" || requestedStatus === "Approved"
      ? requestedStatus
      : "All";

  function changeStatus(nextStatus: string) {
    const url = new URL(window.location.href);

    if (nextStatus === "All") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", nextStatus);
    }

    // Next.js updates useSearchParams when the browser history changes.
    window.history.pushState(null, "", url);
  }

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
          onChange={(event) => changeStatus(event.target.value)}
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
                <h2>
                  <Link href={`/projects/${project.id}`}>{project.name}</Link>
                </h2>
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
