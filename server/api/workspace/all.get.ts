import { api } from "~/convex/_generated/api";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const workspaces = await convexServerClient.query(
    api.workspaces.getAllByMembership,
    {
      id: event.context.user._id,
    }
  );

  return { workspaces };
});
