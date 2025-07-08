import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const getRecord = async (
  ctx: QueryCtx,
  id: Id<"users" | "members" | "messages">
) => {
  return await ctx.db.get(id);
};

const getThreadRepliesBriefInfo = async (
  ctx: QueryCtx,
  parent_message_id: Id<"messages">
) => {
  const replies = await ctx.db
    .query("messages")
    .withIndex("by_parent_message_id", (q) =>
      q.eq("parent_message_id", parent_message_id)
    )
    .collect();

  if (!replies.length)
    return {
      count: 0,
      name: "",
      image: undefined,
      timestamp: 0,
    };

  const lastReply = replies[replies.length - 1];
  const lastReplyMember = (await getRecord(
    ctx,
    lastReply.member_id
  )) as Doc<"members"> | null;

  if (!lastReplyMember)
    return {
      count: replies.length,
      name: lastReply.member_name,
      image: undefined,
      timestamp: lastReply._creationTime,
    };

  const lastReplyUser = (await getRecord(
    ctx,
    lastReplyMember!.user_id
  )) as Doc<"users"> | null;

  return {
    count: replies.length,
    name: lastReplyUser?.name,
    image: lastReplyUser?.avatar,
    timestamp: lastReply._creationTime,
  };
};

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

export const get = query({
  args: {
    user_id: v.id("users"),
    channel_id: v.optional(v.id("channels")),
    conversation_id: v.optional(v.id("dm_conversations")),
    parent_message_id: v.optional(v.id("messages")),
    paginationOpts: paginationOptsValidator,
  },
  async handler(ctx, args) {
    const {
      user_id,
      channel_id,
      conversation_id,
      parent_message_id,
      paginationOpts,
    } = args;

    if (!channel_id && !conversation_id && !parent_message_id)
      throw new ConvexError({
        code: 400,
        message: "Invalid request",
      });

    const user = await getRecord(ctx, user_id);
    if (!user)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    // If user is querying replies to a message in a 1:1 direct-message conversation
    let _conversation_id = conversation_id;
    if (parent_message_id && !channel_id && !conversation_id) {
      // Find parent message's "conversation_id"
      const parentMessage = await ctx.db.get(parent_message_id);
      if (!parentMessage || !parentMessage.conversation_id)
        throw new ConvexError({
          code: 404,
          message: "Parent message/thread not found",
        });

      _conversation_id = parentMessage.conversation_id;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel_id_parent_message_id_conversation_id", (q) =>
        q
          .eq("channel_id", channel_id)
          .eq("parent_message_id", parent_message_id)
          .eq("conversation_id", _conversation_id)
      )
      .order("desc")
      .paginate(paginationOpts);

    const page = await Promise.all(
      messages.page.map(async (message) => {
        const [replies, reactions, image] = await Promise.all([
          getThreadRepliesBriefInfo(ctx, message._id), // get message's replies
          getReactionsByMessageId(ctx, message._id), // get reactions
          message.image ? ctx.storage.getUrl(message.image) : undefined, // get attached image
        ]);

        const reactionsValueAsKey = new Map<string, Id<"members">[]>(); // Map({ ':smile': member_id[], ':clap': member_id[] })
        reactions.map((reaction) => {
          const current = reactionsValueAsKey.get(reaction.value);
          if (current) current.push(reaction.member_id);
          else reactionsValueAsKey.set(reaction.value, [reaction.member_id]);
        });

        return {
          ...message,
          status: "sent",
          image,
          replies,
          reactions: Array.from(reactionsValueAsKey.entries()), // [[':smile', member_id[]], [':clap', member_id[]]]
        };
      })
    );

    return { ...messages, page };
  },
});

export const getThreadByParentMessageId = query({
  args: {
    user_id: v.id("users"),
    parent_message_id: v.optional(v.id("messages")),
    paginationOpts: paginationOptsValidator,
  },
  async handler(ctx, args) {
    const { user_id, parent_message_id, paginationOpts } = args;

    if (!parent_message_id)
      throw new ConvexError({
        code: 400,
        message: "Message ID required",
      });

    const message: Doc<"messages"> | null = (await getRecord(
      ctx,
      parent_message_id
    )) as Doc<"messages"> | null;
    if (!message)
      throw new ConvexError({
        code: 404,
        message: "Thread not found",
      });

    const [memberShip, messages] = await Promise.all([
      getMemberShip(ctx, user_id, message.workspace_id),
      ctx.db
        .query("messages")
        .withIndex("by_parent_message_id", (q) =>
          q.eq("parent_message_id", parent_message_id)
        )
        .order("desc")
        .paginate(paginationOpts),
    ]);

    if (!memberShip.user || !memberShip.data)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    const page = await Promise.all(
      messages.page.map(async (message) => {
        const [reactions, image] = await Promise.all([
          getReactionsByMessageId(ctx, message._id), // get reactions
          message.image ? ctx.storage.getUrl(message.image) : undefined, // get attached image
        ]);

        const reactionsValueAsKey = new Map<string, Id<"members">[]>(); // Map({ ':smile': member_id[], ':clap': member_id[] })
        reactions.map((reaction) => {
          const current = reactionsValueAsKey.get(reaction.value);
          if (current) current.push(reaction.member_id);
          else reactionsValueAsKey.set(reaction.value, [reaction.member_id]);
        });

        return {
          ...message,
          status: "sent",
          image,
          reactions: Array.from(reactionsValueAsKey.entries()), // [[':smile', member_id[]], [':clap', member_id[]]]
        };
      })
    );

    return { ...messages, page };
  },
});

export const create = mutation({
  args: {
    user_id: v.id("users"),
    workspace_id: v.id("workspaces"),
    message: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    channel_id: v.optional(v.id("channels")),
    conversation_id: v.optional(v.id("dm_conversations")),
    parent_message_id: v.optional(v.id("messages")),
  },
  async handler(ctx, args) {
    const {
      user_id,
      workspace_id,
      message,
      image,
      channel_id,
      conversation_id,
      parent_message_id,
    } = args;

    if (!message && !image)
      throw new ConvexError({
        code: 400,
        message: "Empty message",
      });

    if (!channel_id && !conversation_id && !parent_message_id)
      throw new ConvexError({
        code: 400,
        message: "Invalid message",
      });

    // If user replies to a message's own thread in a 1:1 direct-message conversation
    let _conversation_id = conversation_id;
    if (parent_message_id && !channel_id && !conversation_id) {
      // Find parent message
      const parentMessage = await ctx.db.get(parent_message_id);
      if (!parentMessage || !parentMessage.conversation_id)
        throw new ConvexError({
          code: 404,
          message: "Parent message/thread not found",
        });

      _conversation_id = parentMessage.conversation_id;
    }

    const [memberShip, channel, dmConversation, parentMessage] =
      await Promise.all([
        getMemberShip(ctx, user_id, workspace_id),
        channel_id ? ctx.db.get(channel_id) : null,
        _conversation_id ? ctx.db.get(_conversation_id) : null,
        parent_message_id ? ctx.db.get(parent_message_id) : null,
      ]);

    if (channel_id && !channel)
      throw new ConvexError({
        code: 404,
        message: "Channel not found",
      });
    if (conversation_id && !dmConversation)
      throw new ConvexError({
        code: 404,
        message: "Conversation not found",
      });
    if (parent_message_id && !parentMessage)
      throw new ConvexError({
        code: 404,
        message: "Parent message not found",
      });

    return await ctx.db.insert("messages", {
      member_id: memberShip.data._id,
      member_name: memberShip.user.name,
      workspace_id,
      message,
      image,
      channel_id,
      conversation_id,
      parent_message_id,
    });
  },
});

export const update = mutation({
  args: {
    user_id: v.id("users"),
    message_id: v.id("messages"),
    message: v.string(),
  },
  async handler(ctx, args) {
    const { user_id, message_id, message } = args;

    if (!message)
      throw new ConvexError({
        code: 400,
        message: "Empty message",
      });

    if (!message_id)
      throw new ConvexError({
        code: 400,
        message: "Message ID required",
      });

    const [user, messageRec] = await Promise.all([
      ctx.db.get(user_id),
      ctx.db.get(message_id),
    ]);
    if (!user)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });
    if (!messageRec)
      throw new ConvexError({
        code: 404,
        message: "Message not found",
      });

    const membership = (await getRecord(
      ctx,
      messageRec.member_id
    )) as Doc<"members">;
    if (
      !membership ||
      membership._id !== messageRec.member_id ||
      membership.user_id !== user_id
    )
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    await ctx.db.patch(message_id, {
      message,
      updated_at: new Date().getTime(),
    });

    return message_id;
  },
});

export const deleteById = mutation({
  args: {
    user_id: v.id("users"),
    message_id: v.id("messages"),
  },
  async handler(ctx, args) {
    const { user_id, message_id } = args;

    if (!message_id)
      throw new ConvexError({
        code: 400,
        message: "Message ID required",
      });

    const [user, messageRec] = await Promise.all([
      ctx.db.get(user_id),
      ctx.db.get(message_id),
    ]);
    if (!user)
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });
    if (!messageRec)
      throw new ConvexError({
        code: 404,
        message: "Message not found",
      });

    const membership = (await getRecord(
      ctx,
      messageRec.member_id
    )) as Doc<"members">;
    if (
      !membership ||
      membership._id !== messageRec.member_id ||
      membership.user_id !== user_id
    )
      throw new ConvexError({
        code: 401,
        message: "Unauthorized",
      });

    await Promise.all([
      ctx.db.delete(message_id),

      // Delete replying messages

      // Delete reactions

      // ctx.db
      //   .query("messages")
      //   .filter((q) => q.eq("parent_message_id", message_id)),
    ]);

    return message_id;
  },
});
