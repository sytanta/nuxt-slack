import type { EventHandlerRequest, H3Event } from "h3";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";

import type { DataModel, Id } from "~/convex/_generated/dataModel";
import { api } from "~/convex/_generated/api";
import convexServerClient from "../convex";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const SESSION_LIFESPAN = 15 * DAY_IN_MS; // 15 days

export const sessionCookieName = "__nuxt_slack_auth_session";

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
}

export async function createSession(token: string, userId: string) {
  const session_token = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );

  const created_at = new Date().getTime();

  const session = {
    user_id: userId as Id<"users">,
    session_token,
    expired_at: new Date(Date.now() + SESSION_LIFESPAN).getTime(),
    updated_at: created_at,
  };

  await convexServerClient.mutation(api.sessions.create, session);

  return { ...session, created_at };
}

export async function validateSessionToken(token: string) {
  const session_token = encodeHexLowerCase(
    sha256(new TextEncoder().encode(token))
  );

  const { session, user } = await convexServerClient.query(
    api.sessions.getByAccessToken,
    {
      session_token,
    }
  );
  if (!session) return { session: null, user: null };

  // If session is expired
  const sessionExpired = Date.now() >= session.expired_at;
  if (sessionExpired) {
    await convexServerClient.mutation(api.sessions.deleteBySessionToken, {
      session_token,
    });
    return { session: null, user: null };
  }

  // Extend session
  // const renewSession = Date.now() >= session.expired_at - SESSION_LIFESPAN;
  // if (renewSession) {
  //   session.expired_at = new Date(Date.now() + SESSION_LIFESPAN).getTime();
  //   await convexServerClient.mutation(api.sessions.extendSessionToken, {
  //     session_token,
  //     expired_at: session.expired_at,
  //     updated_at: new Date().getTime(),
  //   });
  // }

  return { session, user };
}

export type SessionValidationResult = Awaited<
  ReturnType<typeof validateSessionToken>
>;

export async function invalidateSession(session_token: string) {
  await convexServerClient.mutation(api.sessions.deleteBySessionToken, {
    session_token,
  });
}

export function setSessionTokenCookie(
  event: H3Event<EventHandlerRequest>,
  token: string,
  expiresAt: Date
) {
  setCookie(event, sessionCookieName, token, {
    expires: expiresAt,
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/",
  });
}

export function deleteSessionTokenCookie(event: H3Event<EventHandlerRequest>) {
  deleteCookie(event, sessionCookieName);
}

// Filter user's properties to be returned to client-side
export function serializeUser(user: DataModel["users"]["document"]) {
  if (!user) return null;
  const { _id, email, name, avatar, phone_number } = user;
  return { id: String(_id), email, name, avatar, phone_number };
}
