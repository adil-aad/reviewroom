"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectInput } from "../data";
import { saveProject } from "../store";

export type ProjectFormState = {
  message: string;
  values: ProjectInput;
};

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createProject(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const values = {
    name: readText(formData, "name"),
    client: readText(formData, "client"),
    description: readText(formData, "description"),
  };

  if (!values.name || !values.client || !values.description) {
    return { message: "Enter a project name, client, and description.", values };
  }

  if (values.name.length > 80 || values.client.length > 80) {
    return { message: "Keep the project name and client to 80 characters each.", values };
  }

  if (values.description.length > 500) {
    return { message: "Keep the description to 500 characters.", values };
  }

  try {
    await saveProject(values);
  } catch (error) {
    console.error("Could not save project", error);
    return { message: "Could not save the project. Please try again.", values };
  }

  revalidatePath("/projects");
  redirect("/projects");
}
