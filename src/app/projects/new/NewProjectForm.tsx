"use client";

import { useActionState } from "react";
import { createProject, type ProjectFormState } from "./actions";

const initialState: ProjectFormState = {
  message: "",
  values: { name: "", client: "", description: "" },
};

export default function NewProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, initialState);

  return (
    <form action={formAction} className="project-form">
      <label htmlFor="project-name">Project name</label>
      <input
        id="project-name"
        name="name"
        defaultValue={state.values.name}
        required
        maxLength={80}
      />

      <label htmlFor="project-client">Client</label>
      <input
        id="project-client"
        name="client"
        defaultValue={state.values.client}
        required
        maxLength={80}
      />

      <label htmlFor="project-description">Description</label>
      <textarea
        id="project-description"
        name="description"
        defaultValue={state.values.description}
        required
        maxLength={500}
        rows={4}
      />

      {state.message && <p role="alert" className="form-error">{state.message}</p>}

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}
