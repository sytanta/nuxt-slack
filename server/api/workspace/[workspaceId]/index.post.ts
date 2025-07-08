import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, "workspaceId");
  const { name, join_code } = await readBody(event);

  return await handleServerAction(async () => {
    const newJoinCode = await convexServerClient.mutation(
      api.workspaces.updateById,
      {
        id: workspaceId as Id<"workspaces">,
        user_id: event.context.user._id,
        name,
        join_code: !!join_code,
      }
    );

    return { data: newJoinCode };
  });
});
