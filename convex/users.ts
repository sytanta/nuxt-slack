import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    has_password: v.boolean(),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
    phone_number_verified: v.optional(v.boolean()),
  },
  async handler(ctx, args) {
    // Check if the same user has been created
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existingUser) return existingUser._id;

    return await ctx.db.insert("users", {
      ...args,
      updated_at: new Date().getTime(),
    });
  },
});

export const createWithPassword = mutation({
  args: {
    email: v.string(),
    has_password: v.boolean(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
    phone_number_verified: v.optional(v.boolean()),
    password: v.string(),
  },
  async handler(ctx, args) {
    type ArgKeys = keyof typeof args;

    const userData = (Object.keys(args) as ArgKeys[]).reduce(
      (acc, key) => {
        if (key === "password" || args[key] == undefined) return acc;
        acc[key] = args[key];
        return acc;
      },
      {} as Record<ArgKeys, any>
    );

    // Check if the same user has been created
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const now = new Date().getTime();

    const userId = existingUser
      ? existingUser._id
      : await ctx.db.insert("users", {
          ...userData,
          updated_at: now,
        });

    await ctx.db.insert("user_passwords", {
      user_id: userId,
      password: args.password,
      updated_at: now,
    });

    return { ...userData, _id: userId };
  },
});

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getByEmailWithPassword = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const password = user
      ? await ctx.db
          .query("user_passwords")
          .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
          .unique()
      : null;

    return { user, password };
  },
});

export const getByMembershipId = query({
  args: {
    user_id: v.id("users"),
    membership_id: v.id("members"),
  },
  handler: async (ctx, args) => {
    const { user_id, membership_id } = args;

    const currentUser = await ctx.db.get(user_id);
    if (!currentUser) return null;

    const membership = await ctx.db.get(membership_id);
    if (!membership) return null;

    // Check if the current user is also a member of the same workspace
    const workspace = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", membership.workspace_id)
      )
      .unique();
    if (!workspace) return null;

    const memberUser = await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", membership.user_id))
      .unique();

    return {
      ...memberUser,
      membership_id: membership_id,
      role: membership.role,
      is_admin: membership.role === "admin",
    };
  },
});

export const updateById = mutation({
  args: {
    id: v.id("users"),
    has_password: v.optional(v.boolean()),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
    phone_number_verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    type ArgKeys = keyof typeof args;

    const updatedData = (Object.keys(args) as ArgKeys[]).reduce(
      (acc, key) => {
        if (key === "id" || args[key] == undefined) return acc;
        acc[key] = args[key];
        return acc;
      },
      {} as Record<ArgKeys, any>
    );

    await ctx.db.patch(args.id, updatedData);
  },
});
