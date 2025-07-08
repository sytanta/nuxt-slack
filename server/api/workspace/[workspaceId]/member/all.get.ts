import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, "workspaceId");
  if (!workspaceId)
    throw createError({ status: 400, message: "Workspace ID not found" });

  const members = await convexServerClient.query(api.members.getByWorkspaceId, {
    user_id: event.context.user._id,
    workspace_id: workspaceId as Id<"workspaces">,
  });

  return { members };
});
