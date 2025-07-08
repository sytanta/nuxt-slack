import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const conversationId = getRouterParam(event, "conversationId") as
    | Id<"dm_conversations">
    | undefined;

  const { cursor } = getQuery(event);

  if (!conversationId)
    throw createError({ status: 400, message: "Conversation ID required" });

  return await handleServerAction(async () => {
    const messages = await convexServerClient.query(api.messages.get, {
      user_id: event.context.user._id,
      conversation_id: conversationId,
      paginationOpts: {
        numItems: Number(config.public.messagesPerPage),
        cursor: cursor ? String(cursor) : null,
      },
    });

    return { messages };
  });
});
