import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const workspace_id = getRouterParam(event, "workspaceId");
  const { message, image, channel_id, parent_message_id, conversation_id } =
    await readBody(event);

  return await handleServerAction(async () => {
    const messageId = await convexServerClient.mutation(api.messages.create, {
      user_id: event.context.user._id,
      workspace_id: workspace_id as Id<"workspaces">,
      message,
      image,
      channel_id: channel_id as Id<"channels">,
      parent_message_id,
      conversation_id: conversation_id as Id<"dm_conversations">,
    });

    return { messageId };
  });
});
