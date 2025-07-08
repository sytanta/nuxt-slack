import { DataModel } from "~/convex/_generated/dataModel";
import {
  deleteSessionTokenCookie,
  invalidateSession,
} from "~/lib/auth/credential";

export default defineEventHandler(async (event) => {
  const { user, session } = event.context as {
    user: DataModel["users"]["document"] | null;
    session: DataModel["sessions"]["document"] | null;
  };
  if (!user) return;

  // Delete "sessions" record
  if (session) await invalidateSession(session.session_token);

  // Remove session cookie
  deleteSessionTokenCookie(event);
});
