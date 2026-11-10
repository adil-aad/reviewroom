"use client";

import { useActionState } from "react";
import type { ProjectStatus } from "../data";
import { changeProjectStatus, type StatusFormState } from "./actions";

const initialState: StatusFormState = { message: "", success: false };

export default function ProjectStatusForm({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const [state, formAction, pending] = useActionState(changeProjectStatus, initialState);

  return (
    <form action={formAction} className="project-form">
      <input type="hidden" name="projectId" value={projectId} />

      <label htmlFor="project-status">Change status</label>
      <select
        key={status}
        id="project-status"
        name="status"
        defaultValue={status}
        disabled={pending}
      >
        <option value="Awaiting feedback">Awaiting feedback</option>
        <option value="Approved">Approved</option>
      </select>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving..." : "Save status"}
      </button>

      {state.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={state.success ? "form-success" : "form-error"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
