import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    has_password: v.boolean(),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
    phone_number_verified: v.optional(v.boolean()),
    updated_at: v.optional(v.number()), // convex has "_creationTime" column auto added as well as "by_creation_time" index
  }).index("by_email", ["email"]),
  user_passwords: defineTable({
    user_id: v.id("users"),
    password: v.string(),
    updated_at: v.number(),
  }).index("by_user_id", ["user_id"]),
  sessions: defineTable({
    user_id: v.id("users"),
    session_token: v.string(),
    expired_at: v.number(),
    updated_at: v.number(),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_session_token", ["session_token"]),
  accounts: defineTable({
    user_id: v.id("users"),
    provider: v.string(), // 'google', 'github', 'email'
    provider_account_id: v.string(),
    type: v.string(), // 'oauth', 'email'
    scope: v.string(),
    access_token: v.string(),
    id_token: v.optional(v.string()),
    refresh_token: v.optional(v.string()),
    access_token_expired_at: v.optional(v.number()),
    refresh_token_expired_at: v.optional(v.number()),
    updated_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_provider", ["provider"])
    .index("by_provider_provider_account_id", [
      "provider",
      "provider_account_id",
    ])
    .index("by_access_token", ["access_token"])
    .index("by_refresh_token", ["refresh_token"])
    .index("by_id_token", ["id_token"]),
  verification: defineTable({
    identifier: v.string(), // email, email, or user_id
    token: v.string(),
    type: v.string(), // 'email_verification', 'password_reset', 'otp'
    expired_at: v.number(),
  }).index("by_identifier_token", ["identifier", "token"]),
  rate_limits: defineTable({
    identifier: v.string(), // IP address, email, or user_id
    action: v.string(), // 'login', 'register', 'password_reset', 'email_verification', 'token_refresh'
    attempts: v.number(),
    first_attempt_at: v.number(),
    last_attempt_at: v.number(),
    blocked_until: v.number(),
  })
    .index("by_identifier_action", ["identifier", "action"])
    .index("by_blocked_until", ["blocked_until"]),
  workspaces: defineTable({
    name: v.string(),
    user_id: v.id("users"),
    join_code: v.string(),
    updated_at: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_user_id", ["user_id"]),
  members: defineTable({
    user_id: v.id("users"),
    workspace_id: v.id("workspaces"),
    role: v.union(v.literal("admin"), v.literal("member")),
    updated_at: v.number(),
  })
    .index("by_user_id", ["user_id"])
    .index("by_workspace_id", ["workspace_id"])
    .index("by_user_id_workspace_id", ["user_id", "workspace_id"])
    .index("by_role", ["user_id", "role"]),
  channels: defineTable({
    name: v.string(),
    workspace_id: v.id("workspaces"),
    updated_at: v.number(),
  }).index("by_workspace_id", ["workspace_id"]),
  dm_conversations: defineTable({
    // direct-message (1:1) conversations
    workspace_id: v.id("workspaces"),
    member_ids: v.string(),
    member_id_1: v.id("members"),
    member_id_2: v.id("members"),
  })
    .index("by_workspace_id", ["workspace_id"])
    .index("by_member_ids", ["member_ids"])
    .index("by_member_id_1", ["member_id_1"])
    .index("by_member_id_2", ["member_id_2"]),
  messages: defineTable({
    member_id: v.id("members"),
    member_name: v.optional(v.string()), // this will be used when a member is kicked out of the workspace
    workspace_id: v.id("workspaces"),
    message: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    channel_id: v.optional(v.id("channels")),
    conversation_id: v.optional(v.id("dm_conversations")),
    parent_message_id: v.optional(v.id("messages")),
    updated_at: v.optional(v.number()),
  })
    .index("by_message", ["message"])
    .index("by_member_id", ["member_id"])
    .index("by_workspace_id", ["workspace_id"])
    .index("by_channel_id", ["channel_id"])
    .index("by_conversation_id", ["conversation_id"])
    .index("by_parent_message_id", ["parent_message_id"])
    .index("by_channel_id_parent_message_id_conversation_id", [
      "channel_id",
      "parent_message_id",
      "conversation_id",
    ]),
  reactions: defineTable({
    member_id: v.id("members"),
    workspace_id: v.id("workspaces"),
    message_id: v.id("messages"),
    value: v.string(),
    member_name: v.optional(v.string()), // use this when member is removed from workspace
  })
    .index("by_member_id", ["member_id"])
    .index("by_message_id", ["message_id"])
    .index("by_workspace_id", ["workspace_id"]),
});
