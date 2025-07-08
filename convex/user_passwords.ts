import { v } from "convex/values";

import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    user_id: v.id("users"),
    password: v.string(),
  },
  async handler(ctx, args) {
    const { user_id, password } = args;
    return await ctx.db.insert("user_passwords", {
      user_id,
      password,
      updated_at: new Date().getTime(),
    });
  },
});
