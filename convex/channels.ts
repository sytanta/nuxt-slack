import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import slugify from "~/lib/slugify";

export const create = mutation({
  args: {
    name: v.string(),
    user_id: v.id("users"),
    workspace_id: v.id("workspaces"),
  },
  async handler(ctx, args) {
    const { name, user_id, workspace_id } = args;

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", workspace_id)
      )
      .unique();
    // Only workspace admin can create new channels
    if (!membership || membership.role !== "admin")
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    return await ctx.db.insert("channels", {
      name: slugify(name),
      workspace_id,
      updated_at: new Date().getTime(),
    });
  },
});

export const getById = query({
  args: {
    id: v.id("channels"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.id);
    if (!channel)
      throw new ConvexError({
        code: 404,
        message: "Channel not found",
      });

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", args.user_id).eq("workspace_id", channel.workspace_id)
      )
      .unique();
    // If user is not a member of the parent workspace
    if (!membership)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    return channel;
  },
});

export const getByWorkspaceId = query({
  args: {
    user_id: v.id("users"),
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", args.user_id).eq("workspace_id", args.workspace_id)
      )
      .unique();
    // Check if user is a member of the workspace
    if (!membership)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    return await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspace_id", args.workspace_id)
      )
      .collect();
  },
});

export const updateById = mutation({
  args: {
    id: v.id("channels"),
    user_id: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { id: channel_id, user_id, name } = args;

    const channel = await ctx.db
      .query("channels")
      .withIndex("by_id", (q) => q.eq("_id", channel_id))
      .unique();
    if (!channel)
      throw new ConvexError({
        code: 404,
        message: "Channel not found",
      });

    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_id", (q) => q.eq("_id", channel.workspace_id))
      .unique();
    if (!workspace)
      throw new ConvexError({
        code: 404,
        message: "Invalid channel",
      });

    const memberShip = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", workspace._id)
      )
      .unique();

    // Only workspace admin can update channel
    if (!memberShip || memberShip.role !== "admin")
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    await ctx.db.patch(channel_id, { name });

    return channel_id;
  },
});

export const deleteById = mutation({
  args: {
    id: v.id("channels"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id: channel_id, user_id } = args;

    const channel = await ctx.db
      .query("channels")
      .withIndex("by_id", (q) => q.eq("_id", channel_id))
      .unique();
    if (!channel)
      throw new ConvexError({
        code: 404,
        message: "Channel not found",
      });

    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_id", (q) => q.eq("_id", channel.workspace_id))
      .unique();
    if (!workspace)
      throw new ConvexError({
        code: 404,
        message: "Invalid channel",
      });

    const memberShip = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", workspace._id)
      )
      .unique();

    // Only workspace admin can delete channel
    if (!memberShip || memberShip.role !== "admin")
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel_id", (q) => q.eq("channel_id", channel_id))
      .collect(); // this includes all messages in the channel and their replies

    const reactions = (
      await Promise.all(
        messages.map(({ _id }) =>
          ctx.db
            .query("reactions")
            .withIndex("by_message_id", (q) => q.eq("message_id", _id))
            .collect()
        )
      )
    ).flat();

    await Promise.all([
      ...reactions.map(({ _id }) => ctx.db.delete(_id)), // delete reactions
      ...messages.map(({ _id }) => ctx.db.delete(_id)), // delete messages & replies
      ctx.db.delete(channel_id), // delete channel
    ]);

    return channel_id;
  },
});
