import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Registro de nuevo usuario
export const register = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(), // En producción, usar hash
    role: v.union(v.literal("handyman"), v.literal("client"), v.literal("business")),
    phone: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
    categories: v.optional(v.array(v.string())),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Verificar si el email ya existe
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const now = Date.now();

    // Crear usuario
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: args.role,
      phone: args.phone,
      location: args.location,
      categories: args.categories,
      rating: 0,
      isVerified: false,
      completedJobs: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Crear notificación de bienvenida
    await ctx.db.insert("notifications", {
      userId,
      type: "system",
      title: "¡Bienvenido a Parkiing!",
      message: args.role === "handyman" 
        ? "Completa tu perfil y sube tus documentos para empezar a recibir trabajos"
        : "Encuentra los mejores profesionales para tus necesidades",
      isRead: false,
      createdAt: now,
    });

    return {
      userId,
      success: true,
      message: "Registration successful",
    };
  },
});

// Login de usuario
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(), // En producción, verificar hash
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // En producción, verificar password hash
    // Por ahora, simplemente retornamos el usuario

    // Actualizar última actividad
    await ctx.db.patch(user._id, {
      updatedAt: Date.now(),
    });

    return {
      userId: user._id,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified || false,
        avatar: user.avatar,
        rating: user.rating,
      },
      success: true,
    };
  },
});

// Actualizar perfil
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
    skills: v.optional(v.array(v.string())),
    categories: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { userId, ...updates } = args;

    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Obtener perfil completo
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx: QueryCtx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Obtener estadísticas adicionales
    const documents = await ctx.db
      .query("userDocuments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_client", (q) => q.eq("clientId", args.userId))
      .collect();

    const profilePhotoDoc = documents.find(doc => doc.documentType === "profile_photo");
    const profilePhotoUrl = profilePhotoDoc && profilePhotoDoc.storageId
      ? await ctx.storage.getUrl(profilePhotoDoc.storageId)
      : null;

    return {
      ...user,
      profilePhoto: profilePhotoUrl,
      documentsCount: documents.length,
      verifiedDocuments: documents.filter(doc => doc.verificationStatus === "approved").length,
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.status === "open" || job.status === "in_progress").length,
    };
  },
});

// Verificar email disponible
export const checkEmailAvailability = query({
  args: { email: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return {
      available: !user,
      message: user ? "Email already in use" : "Email available",
    };
  },
});

// Obtener handymen verificados
export const getVerifiedHandymen = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    let handymen = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "handyman"))
      .collect();

    // Filtrar por verificados
    handymen = handymen.filter(h => h.isVerified === true);

    // Filtrar por categoría si se especifica
    if (args.category) {
      handymen = handymen.filter(h =>
        h.categories && args.category && h.categories.includes(args.category)
      );
    }

    // Ordenar por rating
    handymen.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Limitar resultados
    if (args.limit) {
      handymen = handymen.slice(0, args.limit);
    }

    // Obtener fotos de perfil
    const handymenWithPhotos = await Promise.all(
      handymen.map(async (handyman) => {
        if (handyman.avatar) {
          const photoUrl = await ctx.storage.getUrl(handyman.avatar);
          return { ...handyman, profilePhoto: photoUrl };
        }
        return handyman;
      })
    );

    return handymenWithPhotos;
  },
});

// Cambiar contraseña
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    // En producción, verificar contraseña actual y hashear la nueva
    
    await ctx.db.patch(args.userId, {
      updatedAt: Date.now(),
      // En producción: passwordHash: hashPassword(args.newPassword)
    });

    return { success: true, message: "Password updated successfully" };
  },
});

// Solicitar restablecimiento de contraseña
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      // Por seguridad, no revelar si el email existe
      return { success: true, message: "If email exists, reset instructions sent" };
    }

    // En producción: generar token de reset y enviar email
    // Por ahora, solo simulamos
    
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "system",
      title: "Password Reset Requested",
      message: "Password reset link has been sent to your email",
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, message: "Reset instructions sent to email" };
  },
});