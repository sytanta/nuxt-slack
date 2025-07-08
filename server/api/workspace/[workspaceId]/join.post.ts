import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, "workspaceId");
  const { joinCode } = await readBody(event);

  return await handleServerAction(async () => {
    const membershipId = await convexServerClient.mutation(
      api.workspaces.join,
      {
        user_id: event.context.user._id,
        workspace_id: workspaceId as Id<"workspaces">,
        join_code: joinCode,
      }
    );

    return { membershipId };
  });
});
