import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ==================== QUERIES ====================

// Obtener ofertas flash activas
export const getActiveDeals = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const deals = await ctx.db
      .query("flashDeals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrar solo las que no han expirado
    const activeDeals = deals.filter(d => d.endTime > now);
    
    // Ordenar por tiempo restante (las que expiran primero, primero)
    activeDeals.sort((a, b) => a.endTime - b.endTime);

    // Limitar
    const limited = args.limit ? activeDeals.slice(0, args.limit) : activeDeals;

    // Agregar info del restaurante
    const withRestaurantInfo = await Promise.all(
      limited.map(async (deal) => {
        const restaurant = await ctx.db.get(deal.restaurantId);
        return {
          ...deal,
          restaurant: restaurant ? {
            name: restaurant.restaurantInfo?.businessName || restaurant.name,
            logo: restaurant.restaurantInfo?.logoUrl || restaurant.avatar,
            cuisine: restaurant.restaurantInfo?.cuisine || [],
            rating: restaurant.rating,
          } : null,
          timeRemaining: deal.endTime - now,
        };
      })
    );

    return withRestaurantInfo;
  },
});

// Obtener ofertas cercanas
export const getNearbyDeals = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radius = args.radiusKm || 5; // 5km por defecto
    const now = Date.now();

    const activeDeals = await ctx.db
      .query("flashDeals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrar por distancia y tiempo
    const nearbyDeals = activeDeals.filter(deal => {
      if (deal.endTime <= now) return false;
      const distance = calculateDistance(
        args.lat, args.lng,
        deal.location.lat, deal.location.lng
      );
      return distance <= radius;
    });

    // Agregar info del restaurante y distancia
    const withInfo = await Promise.all(
      nearbyDeals.map(async (deal) => {
        const restaurant = await ctx.db.get(deal.restaurantId);
        const distance = calculateDistance(
          args.lat, args.lng,
          deal.location.lat, deal.location.lng
        );
        return {
          ...deal,
          restaurant: restaurant ? {
            name: restaurant.restaurantInfo?.businessName || restaurant.name,
            logo: restaurant.restaurantInfo?.logoUrl || restaurant.avatar,
            cuisine: restaurant.restaurantInfo?.cuisine || [],
            rating: restaurant.rating,
          } : null,
          distance,
          timeRemaining: deal.endTime - now,
        };
      })
    );

    // Ordenar por distancia
    return withInfo.sort((a, b) => a.distance - b.distance);
  },
});

// Obtener detalle de una oferta
export const getDeal = query({
  args: { dealId: v.id("flashDeals") },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return null;

    const restaurant = await ctx.db.get(deal.restaurantId);
    const claims = await ctx.db
      .query("flashDealClaims")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .collect();

    const confirmedClaims = claims.filter(c => 
      c.status === "confirmed" || c.status === "picked_up"
    );

    return {
      ...deal,
      restaurant: restaurant ? {
        id: restaurant._id,
        name: restaurant.restaurantInfo?.businessName || restaurant.name,
        logo: restaurant.restaurantInfo?.logoUrl || restaurant.avatar,
        coverImage: restaurant.restaurantInfo?.coverImageUrl,
        cuisine: restaurant.restaurantInfo?.cuisine || [],
        description: restaurant.restaurantInfo?.description,
        rating: restaurant.rating,
        location: restaurant.location,
        phone: restaurant.phone,
      } : null,
      claimCount: confirmedClaims.length,
      timeRemaining: deal.endTime - Date.now(),
    };
  },
});

// Obtener mis ofertas (como restaurante)
export const getMyDeals = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user || user.role !== "restaurant") return [];

    const deals = await ctx.db
      .query("flashDeals")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", user._id))
      .collect();

    // Agregar estadísticas
    const withStats = await Promise.all(
      deals.map(async (deal) => {
        const claims = await ctx.db
          .query("flashDealClaims")
          .withIndex("by_deal", (q) => q.eq("dealId", deal._id))
          .collect();
        
        return {
          ...deal,
          stats: {
            totalClaims: claims.length,
            confirmedClaims: claims.filter(c => c.status === "confirmed").length,
            pickedUpClaims: claims.filter(c => c.status === "picked_up").length,
            revenue: claims
              .filter(c => c.status === "picked_up")
              .reduce((sum, c) => sum + c.totalAmount, 0),
          },
        };
      })
    );

    return withStats.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Obtener mis claims (como usuario)
export const getMyClaims = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) return [];

    const claims = await ctx.db
      .query("flashDealClaims")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Agregar info de la oferta y restaurante
    const withDealInfo = await Promise.all(
      claims.map(async (claim) => {
        const deal = await ctx.db.get(claim.dealId);
        let restaurant = null;
        if (deal) {
          const rest = await ctx.db.get(deal.restaurantId);
          restaurant = rest ? {
            name: rest.restaurantInfo?.businessName || rest.name,
            logo: rest.restaurantInfo?.logoUrl || rest.avatar,
            location: rest.location,
            phone: rest.phone,
          } : null;
        }
        
        return {
          ...claim,
          deal: deal ? {
            title: deal.title,
            endTime: deal.endTime,
          } : null,
          restaurant,
        };
      })
    );

    return withDealInfo.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ==================== MUTATIONS ====================

// Crear oferta flash (restaurante)
export const createFlashDeal = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    items: v.array(v.object({
      name: v.string(),
      originalPrice: v.number(),
      discountedPrice: v.number(),
      quantity: v.optional(v.number()),
      imageUrl: v.optional(v.string()),
    })),
    discountPercentage: v.number(),
    endTime: v.number(), // Timestamp de cuando termina
    notificationRadius: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");
    if (user.role !== "restaurant") throw new Error("Solo restaurantes pueden crear ofertas flash");
    if (!user.location) throw new Error("Debes configurar la ubicación de tu restaurante");

    const now = Date.now();

    if (args.endTime <= now) {
      throw new Error("La hora de finalización debe ser en el futuro");
    }

    // Determinar si la oferta comienza ahora o está programada
    const startTime = now;
    const isScheduled = args.endTime - now > 4 * 60 * 60 * 1000; // Más de 4 horas

    const dealId = await ctx.db.insert("flashDeals", {
      restaurantId: user._id,
      title: args.title,
      description: args.description,
      items: args.items,
      discountPercentage: args.discountPercentage,
      startTime,
      endTime: args.endTime,
      status: isScheduled ? "scheduled" : "active",
      location: user.location,
      notificationRadius: args.notificationRadius || 5,
      viewCount: 0,
      claimCount: 0,
      pushNotificationSent: false,
      createdAt: now,
      updatedAt: now,
    });

    // Enviar notificaciones push inmediatamente si está activa
    if (!isScheduled) {
      await sendFlashDealNotifications(ctx, dealId, user, args.title, args.discountPercentage);
    }

    return { dealId };
  },
});

// Reclamar/Reservar una oferta
export const claimDeal = mutation({
  args: {
    dealId: v.id("flashDeals"),
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");

    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Oferta no encontrada");
    if (deal.status !== "active") throw new Error("La oferta no está activa");
    
    const now = Date.now();
    if (now > deal.endTime) throw new Error("La oferta ha expirado");

    // Verificar disponibilidad de items
    const claimItems: { name: string; quantity: number; price: number }[] = [];
    let totalAmount = 0;

    for (const requestedItem of args.items) {
      const dealItem = deal.items.find(i => i.name === requestedItem.name);
      if (!dealItem) throw new Error(`Item "${requestedItem.name}" no encontrado`);
      
      // Si hay límite de cantidad, verificar
      if (dealItem.quantity !== undefined) {
        const existingClaims = await ctx.db
          .query("flashDealClaims")
          .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
          .filter((q) => q.neq(q.field("status"), "cancelled"))
          .collect();
        
        const claimedQty = existingClaims.reduce((sum, c) => {
          const item = c.items.find(i => i.name === requestedItem.name);
          return sum + (item?.quantity || 0);
        }, 0);
        
        if (claimedQty + requestedItem.quantity > dealItem.quantity) {
          throw new Error(`Solo quedan ${dealItem.quantity - claimedQty} unidades de "${requestedItem.name}"`);
        }
      }

      claimItems.push({
        name: requestedItem.name,
        quantity: requestedItem.quantity,
        price: dealItem.discountedPrice * requestedItem.quantity,
      });
      totalAmount += dealItem.discountedPrice * requestedItem.quantity;
    }

    // Generar código de recogida
    const pickupCode = generatePickupCode();

    const claimId = await ctx.db.insert("flashDealClaims", {
      dealId: args.dealId,
      userId: user._id,
      items: claimItems,
      totalAmount,
      status: "pending",
      pickupCode,
      createdAt: now,
    });

    // Actualizar contador
    await ctx.db.patch(args.dealId, {
      claimCount: (deal.claimCount || 0) + 1,
      updatedAt: now,
    });

    // Notificar al restaurante
    await ctx.db.insert("notifications", {
      userId: deal.restaurantId,
      type: "flash_deal_claimed",
      title: "¡Nueva reserva de oferta flash!",
      message: `${user.name} ha reservado ${claimItems.map(i => i.name).join(", ")}`,
      data: { dealId: args.dealId, claimId },
      isRead: false,
      createdAt: now,
    });

    return { claimId, pickupCode, totalAmount };
  },
});

// Confirmar reserva (restaurante)
export const confirmClaim = mutation({
  args: { claimId: v.id("flashDealClaims") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");

    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Reserva no encontrada");

    const deal = await ctx.db.get(claim.dealId);
    if (!deal) throw new Error("Oferta no encontrada");
    if (deal.restaurantId !== user._id) throw new Error("No autorizado");

    await ctx.db.patch(args.claimId, {
      status: "confirmed",
      confirmedAt: Date.now(),
    });

    // Notificar al usuario
    await ctx.db.insert("notifications", {
      userId: claim.userId,
      type: "system",
      title: "¡Reserva confirmada!",
      message: `Tu reserva de "${deal.title}" ha sido confirmada. Código: ${claim.pickupCode}`,
      data: { claimId: args.claimId, pickupCode: claim.pickupCode },
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Marcar como recogido (restaurante)
export const markAsPickedUp = mutation({
  args: { 
    claimId: v.id("flashDealClaims"),
    pickupCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");

    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Reserva no encontrada");
    if (claim.pickupCode !== args.pickupCode) throw new Error("Código incorrecto");

    const deal = await ctx.db.get(claim.dealId);
    if (!deal) throw new Error("Oferta no encontrada");
    if (deal.restaurantId !== user._id) throw new Error("No autorizado");

    await ctx.db.patch(args.claimId, {
      status: "picked_up",
      pickedUpAt: Date.now(),
    });

    return { success: true };
  },
});

// Cancelar oferta flash (restaurante)
export const cancelDeal = mutation({
  args: { dealId: v.id("flashDeals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");

    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Oferta no encontrada");
    if (deal.restaurantId !== user._id) throw new Error("No autorizado");

    await ctx.db.patch(args.dealId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    // Cancelar todas las reservas pendientes y notificar
    const claims = await ctx.db
      .query("flashDealClaims")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .filter((q) => q.or(
        q.eq(q.field("status"), "pending"),
        q.eq(q.field("status"), "confirmed")
      ))
      .collect();

    for (const claim of claims) {
      await ctx.db.patch(claim._id, { status: "cancelled" });
      await ctx.db.insert("notifications", {
        userId: claim.userId,
        type: "system",
        title: "Oferta cancelada",
        message: `La oferta "${deal.title}" ha sido cancelada. Tu reserva ha sido anulada.`,
        data: { dealId: args.dealId },
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Incrementar vistas
export const incrementViewCount = mutation({
  args: { dealId: v.id("flashDeals") },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return;

    await ctx.db.patch(args.dealId, {
      viewCount: (deal.viewCount || 0) + 1,
    });
  },
});

// ==================== INTERNAL MUTATIONS ====================

// Función para activar ofertas programadas (llamada por cron)
export const activateScheduledDeals = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    
    const scheduledDeals = await ctx.db
      .query("flashDeals")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    for (const deal of scheduledDeals) {
      // Activar si ya pasó la hora de inicio
      if (deal.startTime <= now && deal.endTime > now) {
        await ctx.db.patch(deal._id, {
          status: "active",
          updatedAt: now,
        });

        const restaurant = await ctx.db.get(deal.restaurantId);
        if (restaurant) {
          await sendFlashDealNotifications(ctx, deal._id, restaurant, deal.title, deal.discountPercentage);
        }
      }
    }
  },
});

// Función para expirar ofertas (llamada por cron)
export const expireDeals = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    
    const activeDeals = await ctx.db
      .query("flashDeals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const deal of activeDeals) {
      if (deal.endTime <= now) {
        await ctx.db.patch(deal._id, {
          status: "expired",
          updatedAt: now,
        });

        // Expirar reservas pendientes
        const pendingClaims = await ctx.db
          .query("flashDealClaims")
          .withIndex("by_deal", (q) => q.eq("dealId", deal._id))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();

        for (const claim of pendingClaims) {
          await ctx.db.patch(claim._id, { status: "expired" });
        }
      }
    }
  },
});

// ==================== HELPERS ====================

async function sendFlashDealNotifications(
  ctx: any, 
  dealId: Id<"flashDeals">, 
  restaurant: any,
  title: string,
  discount: number
) {
  const deal = await ctx.db.get(dealId);
  if (!deal || deal.pushNotificationSent) return;

  const radius = deal.notificationRadius || 5;
  
  // Obtener todos los usuarios con token de push
  const users = await ctx.db
    .query("users")
    .filter((q: any) => q.neq(q.field("pushToken"), undefined))
    .collect();

  // Filtrar por distancia
  const nearbyUsers = users.filter((user: any) => {
    if (!user.location) return false;
    if (user._id === deal.restaurantId) return false;
    
    const distance = calculateDistance(
      deal.location.lat, deal.location.lng,
      user.location.lat, user.location.lng
    );
    return distance <= radius;
  });

  // Crear notificaciones
  const now = Date.now();
  for (const user of nearbyUsers) {
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "flash_deal",
      title: `🔥 ¡${discount}% OFF cerca de ti!`,
      message: `${restaurant.restaurantInfo?.businessName || restaurant.name}: ${title}`,
      data: { dealId, type: "flash_deal" },
      isRead: false,
      createdAt: now,
    });
  }

  // Registrar notificación push masiva
  await ctx.db.insert("pushNotifications", {
    targetType: "radius",
    targetLocation: {
      lat: deal.location.lat,
      lng: deal.location.lng,
      radiusKm: radius,
    },
    title: `🔥 ¡${discount}% OFF cerca de ti!`,
    body: `${restaurant.restaurantInfo?.businessName || restaurant.name}: ${title}`,
    data: { type: "flash_deal", referenceId: dealId },
    status: "sent",
    sentCount: nearbyUsers.length,
    sentAt: now,
    createdAt: now,
  });

  // Marcar como enviada
  await ctx.db.patch(dealId, {
    pushNotificationSent: true,
    pushNotificationSentAt: now,
  });
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function generatePickupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


