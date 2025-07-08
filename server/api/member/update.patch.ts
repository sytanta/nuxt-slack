import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";
import handleServerAction from "~/lib/handleServerAction";

export default defineEventHandler(async (event) => {
  let { membership_id, role } = await readBody(event);

  return await handleServerAction(async () => {
    if (!["admin", "member"].includes(role)) role = "member";

    const removedMemberId = await convexServerClient.mutation(
      api.members.updateById,
      {
        user_id: event.context.user._id,
        membership_id: membership_id as Id<"members">,
        role,
      }
    );

    return { membershipId: removedMemberId };
  });
});
