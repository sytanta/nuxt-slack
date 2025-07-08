import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const channelId = getRouterParam(event, "channelId");

  const deletedChannel = await convexServerClient.mutation(
    api.channels.deleteById,
    {
      id: channelId as Id<"channels">,
      user_id: event.context.user._id,
    }
  );
  if (!deletedChannel)
    throw createError({ status: 404, message: "Channel not found" });

  return { id: channelId };
});
