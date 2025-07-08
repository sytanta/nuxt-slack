import { hash } from "@node-rs/argon2";

import { api } from "~/convex/_generated/api";
import { DataModel } from "~/convex/_generated/dataModel";
import {
  createSession,
  generateSessionToken,
  serializeUser,
  setSessionTokenCookie,
} from "~/lib/auth/credential";
import convexServerClient from "~/lib/convex";

export default defineEventHandler(async (event) => {
  const { name, email, password } = await readBody(event);

  if (!validatePassword(password)) {
    throw createError({
      statusCode: 400,
      message: "Invalid password (min 6, max 255 characters)",
    });
  }

  const existingUser = await convexServerClient.query(api.users.getByEmail, {
    email,
  });

  if (existingUser) {
    if (existingUser.has_password)
      throw createError({
        statusCode: 400,
        message: "User already exists with this email",
      });

    const hashedPassword = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await Promise.allSettled([
      // Set "has_password" to be "true"
      convexServerClient.mutation(api.users.updateById, {
        id: existingUser._id,
        has_password: true,
      }),
      // Create a "user_passwords" record
      convexServerClient.mutation(api.user_passwords.create, {
        user_id: existingUser._id,
        password: hashedPassword,
      }),
    ]);

    return { user: serializeUser(existingUser) };
  }

  const hashedPassword = await hash(password, {
    // recommended minimum parameters
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const newUser = await convexServerClient.mutation(
    api.users.createWithPassword,
    {
      name,
      email,
      has_password: true,
      password: hashedPassword,
    }
  );

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, newUser._id);
  setSessionTokenCookie(event, sessionToken, new Date(session.expired_at));

  return {
    user: serializeUser(newUser as unknown as DataModel["users"]["document"]),
  };
});

function validatePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 6 &&
    password.length <= 255
  );
}
