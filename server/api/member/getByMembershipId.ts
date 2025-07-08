import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const { profile_member_id } = getQuery(event);

  if (!profile_member_id)
    throw createError({ status: 400, message: "Membership ID not found" });

  const member = await convexServerClient.query(api.users.getByMembershipId, {
    user_id: event.context.user._id,
    membership_id: profile_member_id as Id<"members">,
  });

  return { member };
});
