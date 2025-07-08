import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const channelId = getRouterParam(event, "channelId");
  const { name } = await readBody(event);

  return await handleServerAction(async () => {
    await convexServerClient.mutation(api.channels.updateById, {
      id: channelId as Id<"channels">,
      user_id: event.context.user._id,
      name,
    });

    return { data: name };
  });
});
