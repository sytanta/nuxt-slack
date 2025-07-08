import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const { message_id } = await readBody(event);

  return await handleServerAction(async () => {
    await convexServerClient.mutation(api.messages.deleteById, {
      user_id: event.context.user._id,
      message_id: message_id as Id<"messages">,
    });

    return { data: { id: message_id } };
  });
});
