"use server";

import { revalidatePath } from "next/cache";
import type { FeedbackInput } from "../data";
import { saveProjectFeedback } from "../feedback-store";
import { updateProjectStatus } from "../store";

export type StatusFormState = {
  message: string;
  success: boolean;
};

export type FeedbackFormState = {
  message: string;
  success: boolean;
  values: FeedbackInput;
};

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function addProjectFeedback(
  _previousState: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const projectId = readText(formData, "projectId");
  const values = {
    author: readText(formData, "author"),
    message: readText(formData, "message"),
  };

  if (!projectId) {
    return { message: "Choose an existing project.", success: false, values };
  }

  if (!values.author || !values.message) {
    return { message: "Enter your name and feedback.", success: false, values };
  }

  if (values.author.length > 80 || values.message.length > 2000) {
    return {
      message: "Keep your name to 80 characters and feedback to 2,000 characters.",
      success: false,
      values,
    };
  }

  try {
    const entry = await saveProjectFeedback(projectId, values);
    if (!entry) {
      return { message: "This project could not be found.", success: false, values };
    }
  } catch (error) {
    console.error("Could not save project feedback", error);
    return { message: "Could not save feedback. Please try again.", success: false, values };
  }

  revalidatePath(`/projects/${projectId}`);
  return {
    message: "Feedback added.",
    success: true,
    values: { author: values.author, message: "" },
  };
}

export async function changeProjectStatus(
  _previousState: StatusFormState,
  formData: FormData,
): Promise<StatusFormState> {
  const projectId = formData.get("projectId");
  const status = formData.get("status");

  if (typeof projectId !== "string" || !projectId) {
    return { message: "Choose an existing project.", success: false };
  }

  if (status !== "Awaiting feedback" && status !== "Approved") {
    return { message: "Choose a valid project status.", success: false };
  }

  try {
    const project = await updateProjectStatus(projectId, status);

    if (!project) {
      return { message: "This project could not be found.", success: false };
    }
  } catch (error) {
    console.error("Could not update project status", error);
    return { message: "Could not save the status. Please try again.", success: false };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return { message: "Status saved.", success: true };
}
