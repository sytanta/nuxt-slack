import { serializeUser } from "~/lib/auth/credential";

export default defineEventHandler(async (event) => {
  return { user: serializeUser(event.context.user) };
});
