import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const getReactionsByMessageId = async (
  ctx: QueryCtx,
  message_id: Id<"messages">
) => {
  return await ctx.db
    .query("reactions")
    .withIndex("by_message_id", (q) => q.eq("message_id", message_id))
    .collect();
};

const getMemberShip = async (
  ctx: QueryCtx,
  user_id: Id<"users">,
  workspace_id: Id<"workspaces">
) => {
  const [user, membership] = await Promise.all([
    ctx.db.get(user_id),
    ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", workspace_id)
      )
      .unique(),
  ]);

  if (!user || !membership)
    throw new ConvexError({
      code: 401,
      message: "Unauthorized",
    });

  if (user._id !== membership.user_id)
    throw new ConvexError({
      code: 400,
      message: "Invalid membership",
    });

  return { user, data: membership };
};

export const toggle = mutation({
  args: {
    user_id: v.id("users"),
    message_id: v.id("messages"),
    value: v.string(),
  },
  async handler(ctx, args) {
    const { user_id, message_id, value } = args;

    const [user, message] = await Promise.all([
      ctx.db.get(user_id),
      ctx.db.get(message_id),
    ]);
    if (!user)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });
    if (!message)
      throw new ConvexError({
        code: 404,
        message: "Message not found",
      });

    const member = await ctx.db
      .query("members")
      .withIndex("by_user_id_workspace_id", (q) =>
        q.eq("user_id", user_id).eq("workspace_id", message.workspace_id)
      )
      .unique();
    if (!member)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const existingReactionFromUser = await ctx.db
      .query("reactions")
      .filter((q) =>
        q.and(
          q.eq(q.field("message_id"), message_id),
          q.eq(q.field("member_id"), member._id),
          q.eq(q.field("value"), value)
        )
      )
      .first();

    if (existingReactionFromUser) {
      await ctx.db.delete(existingReactionFromUser._id);
      return null;
    } else {
      return await ctx.db.insert("reactions", {
        member_id: member._id,
        member_name: user.name,
        workspace_id: message.workspace_id,
        message_id,
        value,
      });
    }
  },
});
