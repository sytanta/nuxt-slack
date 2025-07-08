import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  const { membership_id } = await readBody(event);

  return await handleServerAction(async () => {
    const removedMemberId = await convexServerClient.mutation(
      api.members.removeMemberById,
      {
        user_id: event.context.user._id,
        membership_id: membership_id as Id<"members">,
      }
    );

    return { membershipId: removedMemberId };
  });
});
