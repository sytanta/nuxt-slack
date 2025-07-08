import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const channelId = getRouterParam(event, "channelId") as
    | Id<"channels">
    | undefined;

  if (!channelId)
    throw createError({ status: 400, message: "Channel ID required" });

  const [channel, messages] = await Promise.all([
    convexServerClient.query(api.channels.getById, {
      id: channelId,
      user_id: event.context.user._id,
    }),
    convexServerClient.query(api.messages.get, {
      user_id: event.context.user._id,
      channel_id: channelId,
      paginationOpts: {
        numItems: Number(config.public.messagesPerPage),
        cursor: null,
      },
    }),
  ]);
  if (!channel)
    throw createError({ status: 404, message: "Channel not found" });

  return { channel, messages };
});
