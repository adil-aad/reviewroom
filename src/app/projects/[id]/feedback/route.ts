import { getProjectFeedback } from "../../feedback-store";
import { getProjects } from "../../store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const projects = await getProjects();
    const project = projects.find((project) => project.id === id);

    if (!project) {
      return Response.json(
        { error: "Project not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const feedback = await getProjectFeedback(project.id);

    return new Response(JSON.stringify({ project, feedback }, null, 2) + "\n", {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="feedback-${encodeURIComponent(project.id)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Could not download project feedback", error);
    return Response.json(
      { error: "Could not download feedback. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
