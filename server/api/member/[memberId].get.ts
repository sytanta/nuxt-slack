import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const membership_id = getRouterParam(event, "memberId");

  if (!membership_id)
    throw createError({ status: 400, message: "Membership ID not found" });

  const member = await convexServerClient.query(api.users.getByMembershipId, {
    user_id: event.context.user._id,
    membership_id: membership_id as Id<"members">,
  });

  return { member };
});
