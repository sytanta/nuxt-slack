import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { GenericMutationCtx } from "convex/server";

// Rate limiting helper
async function checkRateLimit(
  ctx: GenericMutationCtx<any>,
  identifier: string,
  action: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
) {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = await ctx.db
    .query("rate_limits")
    .withIndex("by_identifier_action", (q) =>
      q.eq("identifier", identifier).eq("action", action)
    )
    .first();

  if (existing) {
    if (existing.windowStart > windowStart) {
      if (existing.attempts >= maxAttempts) {
        throw new Error(`Rate limit exceeded for ${action}. Try again later.`);
      }
      await ctx.db.patch(existing._id, { attempts: existing.attempts + 1 });
    } else {
      await ctx.db.patch(existing._id, {
        attempts: 1,
        windowStart: now,
        expiresAt: now + windowMs,
      });
    }
  } else {
    await ctx.db.insert("rate_limits", {
      identifier,
      action,
      attempts: 1,
      windowStart: now,
      expiresAt: now + windowMs,
    });
  }
}

export const createOAuthAccount = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    provider: v.string(), // 'google', 'github', 'email'
    provider_account_id: v.string(),
    scope: v.string(),
    access_token: v.string(),
    id_token: v.optional(v.string()),
    refresh_token: v.optional(v.string()),
    access_token_expired_at: v.optional(v.number()),
    refresh_token_expired_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const {
      provider,
      provider_account_id,
      email,
      name,
      avatar,
      access_token,
      refresh_token,
      access_token_expired_at,
      refresh_token_expired_at,
      scope,
      id_token,
    } = args;
    const now = new Date().getTime();

    // Check if account already exists
    const existingAccount = await ctx.db
      .query("accounts")
      .withIndex("by_provider_provider_account_id", (q) =>
        q
          .eq("provider", provider)
          .eq("provider_account_id", provider_account_id)
      )
      .first();

    if (existingAccount) {
      // Update tokens
      await ctx.db.patch(existingAccount._id, {
        access_token,
        refresh_token,
        access_token_expired_at,
        refresh_token_expired_at,
        scope,
        id_token,
      });

      const user = await ctx.db.get(existingAccount.user_id);
      return user;
    }

    // Check if user exists by email
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      // Create new user
      const userId = await ctx.db.insert("users", {
        email,
        name,
        avatar,
        has_password: false,
        email_verified: true, // OAuth primary email is pre-verified
        updated_at: now,
      });
      user = await ctx.db.get(userId);
    }

    // Create OAuth account
    await ctx.db.insert("accounts", {
      user_id: user!._id,
      provider,
      provider_account_id,
      type: "oauth",
      access_token,
      refresh_token,
      access_token_expired_at,
      refresh_token_expired_at,
      scope,
      id_token,
      updated_at: now,
    });

    return user;
  },
});
