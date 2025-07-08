import { verify } from "@node-rs/argon2";

import { api } from "~/convex/_generated/api";
import {
  createSession,
  generateSessionToken,
  serializeUser,
  setSessionTokenCookie,
} from "~/lib/auth/credential";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  if (!validatePassword(password)) {
    throw createError({
      statusCode: 400,
      message: "Invalid password (min 6, max 255 characters)",
    });
  }

  const { user: existingUser, password: hashedPassword } =
    await convexServerClient.query(api.users.getByEmailWithPassword, {
      email,
    });
  if (!existingUser) {
    throw createError({
      statusCode: 404,
      message: "User not found",
    });
  }
  if (!existingUser.has_password || !hashedPassword) {
    throw createError({
      statusCode: 400,
      message: "Invalid credentials",
    });
  }

  const validPassword = await verify(hashedPassword.password, password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  if (!validPassword) {
    throw createError({
      statusCode: 400,
      message: "Incorrect credential",
    });
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, existingUser._id);
  setSessionTokenCookie(event, sessionToken, new Date(session.expired_at));

  return {
    user: serializeUser(existingUser),
  };
});

function validatePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 6 &&
    password.length <= 255
  );
}
