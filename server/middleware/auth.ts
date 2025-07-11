import {
  deleteSessionTokenCookie,
  sessionCookieName,
  setSessionTokenCookie,
  validateSessionToken,
} from "~/lib/auth/credential";

export default defineEventHandler(async (event) => {
  const sessionToken = getCookie(event, sessionCookieName);

  if (!sessionToken) {
    event.context.user = null;
    event.context.session = null;
  } else {
    const { session, user } = await validateSessionToken(sessionToken);

    if (session) {
      setSessionTokenCookie(event, sessionToken, new Date(session.expired_at));
    } else {
      deleteSessionTokenCookie(event);
    }

    event.context.user = user;
    event.context.session = session;
  }

  // Unauthorized users should be redirected to "/auth"
  if (
    !event.context.user &&
    !event.path.startsWith("/auth") &&
    !event.path.startsWith("/api/auth")
  ) {
    return await sendRedirect(event, "/auth", 303);
  }

  if (event.context.user && event.path.startsWith("/auth")) {
    return await sendRedirect(event, "/", 303);
  }
});
