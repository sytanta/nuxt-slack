import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const { cursor, parent_message_id } = getQuery(event);

  return await handleServerAction(async () => {
    const messages = await convexServerClient.query(
      api.messages.getThreadByParentMessageId,
      {
        user_id: event.context.user._id,
        parent_message_id: parent_message_id as Id<"messages">,
        paginationOpts: {
          numItems: Number(config.public.messagesPerPage),
          cursor: cursor ? String(cursor) : null,
        },
      }
    );

    return { messages };
  });
});
