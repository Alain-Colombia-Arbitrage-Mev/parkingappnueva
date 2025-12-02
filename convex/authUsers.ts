import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

// Helper to get authenticated user identity
async function getAuthUserId(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return identity.tokenIdentifier;
}

// Check if the current user is registered in our database
export const checkUserStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { status: "unauthenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      return { 
        status: "unregistered",
        email: identity.email,
        name: identity.name,
        picture: identity.pictureUrl
      };
    }

    return { 
      status: "registered", 
      role: user.role,
      userId: user._id,
      name: user.name
    };
  },
});

// Create a new user with a specific role
export const createUserWithRole = mutation({
  args: {
    role: v.string(), // "client", "handyman", "business", "restaurant"
    phone: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    bio: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createUserWithRole without authentication present");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (existingUser) {
      // If exists, update role and return
      await ctx.db.patch(existingUser._id, { role: args.role as any });
      return { userId: existingUser._id, status: "updated" };
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: identity.name || "User",
      email: identity.email || "",
      tokenIdentifier: identity.tokenIdentifier,
      auth0Id: identity.subject, // Auth0 user ID (e.g. "auth0|123456")
      role: args.role as any,
      avatar: identity.pictureUrl,
      phone: args.phone,
      categories: args.categories,
      skills: args.skills,
      hourlyRate: args.hourlyRate,
      bio: args.bio,
      location: args.location,
      createdAt: now,
      updatedAt: now,
      isVerified: false,
      rating: 0,
    });

    return { userId, status: "created" };
  },
});

// Get current user profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    return user;
  },
});

// Alias for getCurrentUser to match frontend service usage
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    return user;
  },
});

export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return { isAuthenticated: !!identity };
  },
});

export const updateUserRole = mutation({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { 
      role: args.role as any,
      updatedAt: Date.now()
    });

    return { success: true };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateHandymanProfile = mutation({
  args: {
    categories: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    bio: v.optional(v.string()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    // Validar que sea handyman o business
    if (user.role !== "handyman" && user.role !== "business") {
      // throw new Error("Only handymen can update professional profile"); 
      // Permitimos actualizar, pero es raro.
    }

    await ctx.db.patch(user._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteMyAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.delete(user._id);

    return { success: true };
  },
});

export const getCategories = query({
  args: {},
  handler: async () => {
    return [
      "Plomería",
      "Electricidad",
      "Carpintería",
      "Limpieza",
      "Pintura",
      "Jardinería",
      "Construcción",
      "Mecánica",
      "Mudanzas",
      "Tecnología",
      "Eventos",
      "Belleza",
      "Otros"
    ];
  },
});

// Legacy method support
export const storeUser = mutation({
  args: { role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (user) {
      if (args.role && user.role !== args.role) {
         await ctx.db.patch(user._id, { role: args.role as any });
      }
      return { userId: user._id, status: "existing" };
    }

    const userId = await ctx.db.insert("users", {
      name: identity.name || "User",
      email: identity.email || "",
      tokenIdentifier: identity.tokenIdentifier,
      auth0Id: identity.subject,
      role: (args.role || "client") as any,
      avatar: identity.pictureUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rating: 0,
    });

    return { userId, status: "created" };
  },
});

