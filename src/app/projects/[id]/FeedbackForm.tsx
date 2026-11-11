"use client";

import { useActionState } from "react";
import { addProjectFeedback, type FeedbackFormState } from "./actions";

const initialState: FeedbackFormState = {
  message: "",
  success: false,
  values: { author: "", message: "" },
};

export default function FeedbackForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(addProjectFeedback, initialState);

  return (
    <form action={formAction} className="project-form" aria-label="Add feedback">
      <input type="hidden" name="projectId" value={projectId} />

      <label htmlFor="feedback-author">Your name</label>
      <input
        id="feedback-author"
        name="author"
        autoComplete="name"
        defaultValue={state.values.author}
        required
        maxLength={80}
        disabled={pending}
      />

      <label htmlFor="feedback-message">Your feedback</label>
      <textarea
        id="feedback-message"
        name="message"
        defaultValue={state.values.message}
        required
        maxLength={2000}
        rows={4}
        disabled={pending}
      />

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Adding..." : "Add feedback"}
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
