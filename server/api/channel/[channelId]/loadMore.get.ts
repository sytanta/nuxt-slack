import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const channelId = getRouterParam(event, "channelId") as
    | Id<"channels">
    | undefined;

  const { cursor } = getQuery(event);

  if (!channelId)
    throw createError({ status: 400, message: "Channel ID required" });

  return await handleServerAction(async () => {
    const messages = await convexServerClient.query(api.messages.get, {
      user_id: event.context.user._id,
      channel_id: channelId,
      paginationOpts: {
        numItems: Number(config.public.messagesPerPage),
        cursor: cursor ? String(cursor) : null,
      },
    });

    return { messages };
  });
});
