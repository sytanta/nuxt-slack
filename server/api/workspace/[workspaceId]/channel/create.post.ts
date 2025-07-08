import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const workspace_id = getRouterParam(event, "workspaceId");
  const { name } = await readBody(event);

  const user_id = event.context.user._id;

  const channelId = await convexServerClient.mutation(api.channels.create, {
    name,
    user_id,
    workspace_id: workspace_id! as Id<"workspaces">,
  });

  const channel = await convexServerClient.query(api.channels.getById, {
    id: channelId,
    user_id,
  });

  return { channel };
});
