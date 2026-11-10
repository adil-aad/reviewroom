"use server";

import { revalidatePath } from "next/cache";
import { updateProjectStatus } from "../store";

export type StatusFormState = {
  message: string;
  success: boolean;
};

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
