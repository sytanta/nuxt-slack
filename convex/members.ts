import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

export const getByWorkspaceId = query({
  args: {
    user_id: v.id("users"),
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspace_id", args.workspace_id)
      )
      .collect();
    // Check if user is a member of the workspace
    if (!members.find(({ user_id: ui }) => ui === args.user_id))
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const usersData = await Promise.allSettled(
      members.map(({ user_id }) => ctx.db.get(user_id))
    );

    const users = usersData
      .map((user, index) => {
        return user.status === "fulfilled"
          ? {
              ...user.value,
              membership_id: members[index]._id,
              role: members[index].role,
              is_admin: members[index].role === "admin",
            }
          : null;
      })
      .filter(Boolean) as (Doc<"users"> & {
      membership_id: Id<"members">;
      role: "admin" | "member";
      is_admin: boolean;
    })[];

    return users;
  },
});

export const updateById = mutation({
  args: {
    user_id: v.id("users"),
    membership_id: v.id("members"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const { user_id, membership_id, role } = args;

    const user = await ctx.db.get(user_id);
    if (!user)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const membership = await ctx.db.get(membership_id);
    if (!membership)
      throw new ConvexError({
        code: 404,
        message: "Member not found",
      });

    const currentUserMembership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", membership.workspace_id)
      )
      .unique();
    if (!currentUserMembership || currentUserMembership.role !== "admin")
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    await ctx.db.patch(membership_id, { role });

    return { membershipId: membership_id };
  },
});

export const removeMemberById = mutation({
  args: {
    user_id: v.id("users"),
    membership_id: v.id("members"),
  },
  handler: async (ctx, args) => {
    const { user_id, membership_id } = args;

    const user = await ctx.db.get(user_id);
    if (!user)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const membership = await ctx.db.get(membership_id);
    if (!membership) return null;

    // Cannot remove an admin, downgrade him first
    if (membership.role === "admin")
      throw new ConvexError({
        code: 400,
        message: "Cannot remove workspace admin",
      });

    // Can self-remove if user has "member" role
    if (membership.user_id === user_id) {
      await ctx.db.delete(membership_id);
      return { membershipId: membership_id };
    }

    // An admin can remove a member
    const currentUserMembership = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", membership.workspace_id)
      )
      .unique();
    if (!currentUserMembership || currentUserMembership.role !== "admin")
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const directConversations = await ctx.db
      .query("dm_conversations")
      .filter((q) =>
        q.or(
          q.eq(q.field("member_id_1"), membership_id),
          q.eq(q.field("member_id_2"), membership_id)
        )
      )
      .collect();

    const messagesInDirectConversations = (
      await Promise.all(
        directConversations.map(({ _id }) =>
          ctx.db
            .query("messages")
            .withIndex("by_conversation_id", (q) =>
              q.eq("conversation_id", _id)
            )
            .collect()
        )
      )
    ).flat(); // this includes all 1:1 messages and their replies

    const reactions = (
      await Promise.all(
        messagesInDirectConversations.map(({ _id }) =>
          ctx.db
            .query("reactions")
            .withIndex("by_message_id", (q) => q.eq("message_id", _id))
            .collect()
        )
      )
    ).flat();

    await Promise.all([
      ...reactions.map(({ _id }) => ctx.db.delete(_id)), // remove reactions
      ...messagesInDirectConversations.map(({ _id }) => ctx.db.delete(_id)), // remove replies
      ...directConversations.map(({ _id }) => ctx.db.delete(_id)), // remove direct conversations
      ctx.db.delete(membership_id), // remove membership
    ]);

    // Messages and reactions which are not in 1:1 conversations with this member are kept as-is

    return { membershipId: membership_id };
  },
});
