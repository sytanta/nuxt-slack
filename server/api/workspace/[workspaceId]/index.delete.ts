import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, "workspaceId");

  const deletedWorkspace = await convexServerClient.mutation(
    api.workspaces.deleteById,
    {
      id: workspaceId as Id<"workspaces">,
      user_id: event.context.user._id,
    }
  );
  if (!deletedWorkspace)
    throw createError({ status: 404, message: "Workspace not found" });

  return { id: workspaceId };
});
