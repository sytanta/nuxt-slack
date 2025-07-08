import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const { message_id, value } = await readBody(event);

  return await handleServerAction(async () => {
    const res = await convexServerClient.mutation(api.reactions.toggle, {
      user_id: event.context.user._id,
      message_id: message_id as Id<"messages">,
      value,
    });

    return { reactionId: res };
  });
});
