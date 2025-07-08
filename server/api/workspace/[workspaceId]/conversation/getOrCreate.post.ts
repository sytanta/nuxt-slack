import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const workspaceId = getRouterParam(event, "workspaceId");
  const { other_member_id } = await readBody(event);

  const [otherUser, conversationId] = await Promise.all([
    convexServerClient.query(api.users.getByMembershipId, {
      user_id: event.context.user._id,
      membership_id: other_member_id,
    }),
    convexServerClient.mutation(api.conversations.getOrCreate, {
      user_id: event.context.user._id,
      workspace_id: workspaceId as Id<"workspaces">,
      other_member_id,
    }),
  ]);

  if (!otherUser) throw createError({ status: 404, message: "User not found" });
  if (!conversationId)
    throw createError({ status: 404, message: "Conversation not found" });

  const messages = await convexServerClient.query(api.messages.get, {
    user_id: event.context.user._id,
    conversation_id: conversationId,
    paginationOpts: {
      numItems: Number(config.public.messagesPerPage),
      cursor: null,
    },
  });

  return { conversationId, otherUser, messages };
});
