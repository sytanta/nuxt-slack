import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, "workspaceId");

  if (!workspaceId)
    throw createError({
      status: 400,
      message: "Workspace ID required",
    });

  const channels = await convexServerClient.query(
    api.channels.getByWorkspaceId,
    {
      workspace_id: workspaceId as Id<"workspaces">,
      user_id: event.context.user._id,
    }
  );

  return { channels };
});
