import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const getAllByMembership = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.id))
      .collect();

    const data = await Promise.allSettled(
      members.map(({ workspace_id }) => ctx.db.get(workspace_id))
    );

    const workspaces = data
      .map((ws) => {
        return ws.status === "fulfilled" ? ws.value : null;
      })
      .filter(Boolean) as Doc<"workspaces">[];

    return workspaces;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    user_id: v.id("users"),
  },
  async handler(ctx, args) {
    const now = new Date().getTime();

    const workspaceId = await ctx.db.insert("workspaces", {
      ...args,
      join_code: generateJoinCode(),
      updated_at: now,
    });

    await Promise.all([
      ctx.db.insert("members", {
        user_id: args.user_id,
        workspace_id: workspaceId,
        role: "admin",
        updated_at: now,
      }),
      ctx.db.insert("channels", {
        name: "general",
        workspace_id: workspaceId,
        updated_at: now,
      }),
    ]);

    return workspaceId;
  },
});

export const getById = query({
  args: {
    id: v.id("workspaces"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", args.user_id).eq("workspace_id", args.id)
      )
      .unique();
    if (!membership)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const workspace = await ctx.db.get(args.id);

    return { ...workspace, user_membership_id: membership._id };
  },
});

export const getInfoById = query({
  args: {
    id: v.id("workspaces"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [workspace, membership] = await Promise.all([
      ctx.db.get(args.id),
      ctx.db
        .query("members")
        .withIndex("by_user_id_workspace_id", (q) =>
          q.eq("user_id", args.user_id).eq("workspace_id", args.id)
        )
        .unique(),
    ]);

    if (!workspace)
      throw new ConvexError({ code: 404, message: "Workspace not found" });

    return {
      name: workspace?.name,
      isMember: !!membership,
    };
  },
});

const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
const generateJoinCode = () => {
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

export const updateById = mutation({
  args: {
    id: v.id("workspaces"),
    user_id: v.id("users"),
    name: v.optional(v.string()),
    join_code: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id: workspace_id, user_id, name, join_code } = args;

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", workspace_id)
      )
      .unique();

    // Only workspace admin can update workspace
    if (!membership || membership.role !== "admin")
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    let newJoinCode = "";

    const updatedData: { name?: string; join_code?: string } = {};
    if (name) updatedData.name = name;
    if (join_code) newJoinCode = updatedData.join_code = generateJoinCode();

    await ctx.db.patch(workspace_id, updatedData);

    return join_code ? newJoinCode : workspace_id;
  },
});

export const deleteById = mutation({
  args: {
    id: v.id("workspaces"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) => q.eq("workspace_id", args.id))
      .collect();

    // If user is not an admin
    if (
      !members.find(
        ({ user_id: owner_id, role }) =>
          owner_id === args.user_id && role === "admin"
      )
    )
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", (q) => q.eq("workspace_id", args.id))
      .collect();

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_workspace_id", (q) => q.eq("workspace_id", args.id))
      .collect(); // this includes messages in all channels, 1:1 messages and all their replies

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

    const directConversations = (
      await Promise.all(
        members.map(({ _id }) =>
          ctx.db
            .query("dm_conversations")
            .filter((q) =>
              q.or(
                q.eq(q.field("member_id_1"), _id),
                q.eq(q.field("member_id_2"), _id)
              )
            )
            .collect()
        )
      )
    ).flat();

    await Promise.all([
      ...reactions.map(({ _id }) => ctx.db.delete(_id)), // delete reactions
      ...messages.map(({ _id }) => ctx.db.delete(_id)), // delete messages & replies
      ...channels.map(({ _id }) => ctx.db.delete(_id)), // delete channels
      ...directConversations.map(({ _id }) => ctx.db.delete(_id)), // delete 1:1 conversations
      ...members.map(({ _id }) => ctx.db.delete(_id)), // delete members
      ctx.db.delete(args.id), // delete workspace
    ]);

    return args.id;
  },
});

export const join = mutation({
  args: {
    user_id: v.id("users"),
    workspace_id: v.id("workspaces"),
    join_code: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
  },
  handler: async (ctx, args) => {
    const { user_id, workspace_id, join_code, role = "member" } = args;

    const user = await ctx.db.get(args.user_id);
    if (!user)
      throw new ConvexError({
        code: 404,
        message: "User not found",
      });

    const workspace = await ctx.db.get(args.workspace_id);
    if (!workspace)
      throw new ConvexError({
        code: 404,
        message: "Workspace not found",
      });
    if (workspace.join_code !== join_code.toLowerCase())
      throw new ConvexError({
        code: 400,
        message: "Invalid invite code",
      });

    const membership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", args.user_id).eq("workspace_id", args.workspace_id)
      )
      .collect();
    if (membership.length)
      throw new ConvexError({
        code: 400,
        message: "User is already a member",
      }); // user is already a member

    const membershipId = await ctx.db.insert("members", {
      user_id,
      workspace_id,
      role,
      updated_at: new Date().getTime(),
    });

    return membershipId;
  },
});
