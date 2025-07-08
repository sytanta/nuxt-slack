import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getOrCreate = mutation({
  args: {
    user_id: v.id("users"),
    workspace_id: v.id("workspaces"),
    other_member_id: v.id("members"),
  },
  async handler(ctx, args) {
    const { user_id, workspace_id, other_member_id } = args;

    const user = await ctx.db.get(user_id);
    if (!user)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const [membership, otherMembership] = await Promise.all([
      ctx.db
        .query("members")
        .withIndex("by_user_id_workspace_id", (q) =>
          q.eq("user_id", user_id).eq("workspace_id", workspace_id)
        )
        .unique(),
      ctx.db.get(other_member_id),
    ]);
    if (!membership)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });
    if (!otherMembership)
      throw new ConvexError({
        code: 404,
        message: "Member not found",
      });

    const combinedIds = [membership._id, other_member_id].sort().join("___");
    const existingConversation = await ctx.db
      .query("dm_conversations")
      .withIndex("by_member_ids", (q) => q.eq("member_ids", combinedIds))
      .unique();

    return existingConversation
      ? existingConversation._id
      : await ctx.db.insert("dm_conversations", {
          workspace_id,
          member_ids: combinedIds,
          member_id_1: membership._id,
          member_id_2: otherMembership._id,
        });
  },
});
