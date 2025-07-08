import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    user_id: v.id("users"),
    session_token: v.string(),
    expired_at: v.number(),
    updated_at: v.number(),
  },
  async handler(ctx, args) {
    return await ctx.db.insert("sessions", args);
  },
});

export const getByAccessToken = query({
  args: {
    session_token: v.string(),
  },
  handler: async (ctx, args) => {
    const { session_token } = args;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_token", (q) =>
        q.eq("session_token", session_token)
      )
      .unique();

    const user = session
      ? await ctx.db
          .query("users")
          .withIndex("by_id", (q) => q.eq("_id", session?.user_id))
          .unique()
      : null;

    return { session, user };
  },
});

export const deleteBySessionToken = mutation({
  args: {
    session_token: v.string(),
  },
  handler: async (ctx, args) => {
    const { session_token } = args;

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_session_token", (q) =>
        q.eq("session_token", session_token)
      )
      .collect();

    await Promise.all(sessions.map(async (s) => ctx.db.delete(s._id)));
  },
});

export const extendSessionToken = mutation({
  args: {
    session_token: v.string(),
    expired_at: v.number(),
    updated_at: v.number(),
  },
  handler: async (ctx, args) => {
    const { session_token, expired_at, updated_at } = args;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_token", (q) =>
        q.eq("session_token", session_token)
      )
      .unique();
    if (!session) return;

    await ctx.db.patch(session?._id, { expired_at, updated_at });
  },
});
