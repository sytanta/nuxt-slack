import { api } from "~/convex/_generated/api";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const { name } = await readBody(event);

  const workspaceId = await convexServerClient.mutation(api.workspaces.create, {
    name,
    user_id: event.context.user._id,
  });

  return { id: workspaceId };
});
