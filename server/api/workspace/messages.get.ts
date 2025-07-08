import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

const BATCH_SIZE = 20;

export default defineEventHandler(async (event) => {
  const channel_id = getRouterParam(event, "channelId") as Id<"channels">;
  const conversation_id = getRouterParam(
    event,
    "conversationId"
  ) as Id<"dm_conversations">;
  const parent_message_id = getRouterParam(
    event,
    "parentMessageId"
  ) as Id<"messages">;

  const cursor: string | null = getRouterParam(event, "cursor") ?? null;

  const messages = await convexServerClient.query(api.messages.get, {
    user_id: event.context.user._id,
    channel_id,
    conversation_id,
    parent_message_id,
    paginationOpts: { numItems: BATCH_SIZE, cursor },
  });

  return { messages };
});
