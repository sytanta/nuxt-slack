import { api } from "~/convex/_generated/api";
import convexServerClient from "~/lib/convex";
import {
  createSession,
  generateSessionToken,
  serializeUser,
  setSessionTokenCookie,
} from "~/lib/auth/credential";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { code } = await readBody(event);

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Authorization code not found",
    });
  }

  // Exchange code for tokens
  const tokenResponse: {
    access_token: string;
    scope: string;
  } = await $fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: {
      client_id: config.public.githubClientId,
      client_secret: config.githubClientSecret,
      code,
    },
  });

  if (!tokenResponse.access_token)
    throw createError({
      statusCode: 500,
      message: "Failed to get GitHub access token",
    });

  // Get user info
  const userInfo: { node_id: string; name: string; avatar_url: string } =
    await $fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

  // Get user email
  const emails: {
    email: string;
    primary: boolean;
    verified: boolean;
  }[] = await $fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokenResponse.access_token}`,
    },
  });

  const primaryEmail = emails.find((email) => email.primary)?.email;

  // Create or update user and account
  const user = await convexServerClient.mutation(api.auth.createOAuthAccount, {
    name: userInfo.name,
    email: primaryEmail!,
    avatar: userInfo.avatar_url,
    provider: "github",
    provider_account_id: userInfo.node_id,
    access_token: tokenResponse.access_token,
    scope: tokenResponse.scope,
  });

  // Create auth session
  let xForwardedHeader = event.node.req.headers["x-forwarded-for"];
  if (Array.isArray(xForwardedHeader)) xForwardedHeader = xForwardedHeader[0];

  const sessionToken = generateSessionToken();
  const session = await createSession(
    sessionToken,
    user!._id,
    xForwardedHeader?.split(",").shift() ||
      event.context.clientAddress ||
      event.node.req.socket.remoteAddress,
    getHeader(event, "user-agent")
  );
  setSessionTokenCookie(event, sessionToken, new Date(session.expired_at));

  return {
    success: true,
    user: serializeUser(user),
  };
});
