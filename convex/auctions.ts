import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ==================== QUERIES ====================

// Obtener subastas activas
export const getActiveAuctions = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("auctions")
      .withIndex("by_status", (q) => q.eq("status", "active"));

    const auctions = await query.collect();
    
    // Filtrar por categoría si se especifica
    let filtered = args.category 
      ? auctions.filter(a => a.category === args.category)
      : auctions;
    
    // Ordenar por tiempo restante
    filtered.sort((a, b) => a.auctionConfig.endTime - b.auctionConfig.endTime);
    
    // Limitar resultados
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Agregar info del cliente
    const withClientInfo = await Promise.all(
      filtered.map(async (auction) => {
        const client = await ctx.db.get(auction.clientId);
        const bidCount = await ctx.db
          .query("bids")
          .withIndex("by_auction", (q) => q.eq("auctionId", auction._id))
          .collect();
        
        return {
          ...auction,
          client: client ? { name: client.name, avatar: client.avatar } : null,
          bidCount: bidCount.length,
          timeRemaining: auction.auctionConfig.endTime - Date.now(),
        };
      })
    );

    return withClientInfo;
  },
});

// Obtener subasta por ID
export const getAuction = query({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) return null;

    const client = await ctx.db.get(auction.clientId);
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_auction", (q) => q.eq("auctionId", args.auctionId))
      .collect();

    // Ordenar pujas por monto (menor primero para reverse auction)
    bids.sort((a, b) => 
      auction.auctionConfig.type === "reverse" 
        ? a.amount - b.amount 
        : b.amount - a.amount
    );

    // Agregar info de los postores
    const bidsWithBidders = await Promise.all(
      bids.map(async (bid) => {
        const bidder = await ctx.db.get(bid.bidderId);
        return {
          ...bid,
          bidder: bidder ? {
            name: bidder.name,
            avatar: bidder.avatar,
            rating: bidder.rating,
            completedJobs: bidder.completedJobs,
          } : null,
        };
      })
    );

    return {
      ...auction,
      client: client ? { 
        name: client.name, 
        avatar: client.avatar,
        rating: client.rating,
      } : null,
      bids: bidsWithBidders,
      timeRemaining: auction.auctionConfig.endTime - Date.now(),
    };
  },
});

// Obtener mis subastas (como cliente)
export const getMyAuctions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) return [];

    const auctions = await ctx.db
      .query("auctions")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .collect();

    return auctions.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Obtener mis pujas (como handyman)
export const getMyBids = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) return [];

    const bids = await ctx.db
      .query("bids")
      .withIndex("by_bidder", (q) => q.eq("bidderId", user._id))
      .collect();

    // Agregar info de la subasta
    const bidsWithAuction = await Promise.all(
      bids.map(async (bid) => {
        const auction = await ctx.db.get(bid.auctionId);
        return {
          ...bid,
          auction: auction ? {
            title: auction.title,
            status: auction.status,
            endTime: auction.auctionConfig.endTime,
            currentBestBid: auction.currentBestBid,
          } : null,
        };
      })
    );

    return bidsWithAuction.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Obtener subastas cercanas
export const getNearbyAuctions = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const radius = args.radiusKm || 10;
    
    const activeAuctions = await ctx.db
      .query("auctions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrar por distancia
    const nearby = activeAuctions.filter(auction => {
      const distance = calculateDistance(
        args.lat, args.lng,
        auction.location.lat, auction.location.lng
      );
      return distance <= radius;
    });

    return nearby.map(a => ({
      ...a,
      distance: calculateDistance(args.lat, args.lng, a.location.lat, a.location.lng),
    })).sort((a, b) => a.distance - b.distance);
  },
});

// ==================== MUTATIONS ====================

// Crear nueva subasta
export const createAuction = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    initialOffer: v.object({
      amount: v.number(),
      currency: v.string(),
    }),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    images: v.optional(v.array(v.string())),
    isUrgent: v.optional(v.boolean()),
    durationHours: v.optional(v.number()), // Duración de la subasta
    auctionType: v.optional(v.union(v.literal("reverse"), v.literal("standard"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");

    const now = Date.now();
    const durationMs = (args.durationHours || 24) * 60 * 60 * 1000;

    const auctionId = await ctx.db.insert("auctions", {
      title: args.title,
      description: args.description,
      category: args.category,
      initialOffer: args.initialOffer,
      clientId: user._id,
      status: "active",
      location: args.location,
      images: args.images,
      isUrgent: args.isUrgent || false,
      auctionConfig: {
        endTime: now + durationMs,
        type: args.auctionType || "reverse", // Por defecto, gana el precio más bajo
        minBidStep: args.initialOffer.amount * 0.01, // 1% mínimo
        autoExtendMinutes: 5, // Extender 5 min si hay puja en últimos 5 min
      },
      totalBids: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Notificar a handymen de la categoría
    const handymen = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "handyman"))
      .collect();

    const relevantHandymen = handymen.filter(h => 
      h.categories?.includes(args.category) && h.pushToken
    );

    // Crear notificaciones
    for (const handyman of relevantHandymen) {
      await ctx.db.insert("notifications", {
        userId: handyman._id,
        type: "job_match",
        title: "¡Nueva subasta en tu área!",
        message: `${args.title} - Oferta inicial: ${args.initialOffer.amount} ${args.initialOffer.currency}`,
        data: { auctionId, category: args.category },
        isRead: false,
        createdAt: now,
      });
    }

    return { auctionId };
  },
});

// Hacer una puja
export const placeBid = mutation({
  args: {
    auctionId: v.id("auctions"),
    amount: v.number(),
    message: v.optional(v.string()),
    estimatedTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");
    if (user.role !== "handyman") throw new Error("Solo handymen pueden pujar");

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) throw new Error("Subasta no encontrada");
    if (auction.status !== "active") throw new Error("La subasta no está activa");
    if (auction.clientId === user._id) throw new Error("No puedes pujar en tu propia subasta");

    const now = Date.now();
    if (now > auction.auctionConfig.endTime) throw new Error("La subasta ha terminado");

    // Validar monto según tipo de subasta
    const isReverse = auction.auctionConfig.type === "reverse";
    const currentBest = auction.currentBestBid?.amount || auction.initialOffer.amount;
    
    if (isReverse && args.amount >= currentBest) {
      throw new Error(`Tu puja debe ser menor a ${currentBest}`);
    }
    if (!isReverse && args.amount <= currentBest) {
      throw new Error(`Tu puja debe ser mayor a ${currentBest}`);
    }

    // Verificar si el usuario ya tiene una puja activa
    const existingBid = await ctx.db
      .query("bids")
      .withIndex("by_auction", (q) => q.eq("auctionId", args.auctionId))
      .filter((q) => q.and(
        q.eq(q.field("bidderId"), user._id),
        q.eq(q.field("status"), "active")
      ))
      .first();

    if (existingBid) {
      // Actualizar puja existente
      await ctx.db.patch(existingBid._id, {
        amount: args.amount,
        message: args.message,
        estimatedTime: args.estimatedTime,
        createdAt: now,
      });
    } else {
      // Crear nueva puja
      await ctx.db.insert("bids", {
        auctionId: args.auctionId,
        bidderId: user._id,
        amount: args.amount,
        currency: auction.initialOffer.currency,
        message: args.message,
        estimatedTime: args.estimatedTime,
        status: "active",
        createdAt: now,
      });

      // Incrementar contador de pujas
      await ctx.db.patch(args.auctionId, {
        totalBids: (auction.totalBids || 0) + 1,
      });
    }

    // Actualizar mejor puja
    const shouldUpdate = isReverse 
      ? args.amount < (auction.currentBestBid?.amount || Infinity)
      : args.amount > (auction.currentBestBid?.amount || 0);

    if (shouldUpdate) {
      // Notificar al anterior mejor postor
      if (auction.currentBestBid?.bidderId && auction.currentBestBid.bidderId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: auction.currentBestBid.bidderId,
          type: "auction_outbid",
          title: "¡Han superado tu puja!",
          message: `Alguien ofreció ${args.amount} en "${auction.title}"`,
          data: { auctionId: args.auctionId },
          isRead: false,
          createdAt: now,
        });
      }

      await ctx.db.patch(args.auctionId, {
        currentBestBid: {
          amount: args.amount,
          bidderId: user._id,
          bidTime: now,
        },
        updatedAt: now,
      });
    }

    // Notificar al dueño de la subasta
    await ctx.db.insert("notifications", {
      userId: auction.clientId,
      type: "auction_new_bid",
      title: "¡Nueva puja recibida!",
      message: `${user.name} ofreció ${args.amount} en "${auction.title}"`,
      data: { auctionId: args.auctionId, bidAmount: args.amount },
      isRead: false,
      createdAt: now,
    });

    // Auto-extensión si está en los últimos minutos
    const timeRemaining = auction.auctionConfig.endTime - now;
    const extendThreshold = (auction.auctionConfig.autoExtendMinutes || 5) * 60 * 1000;
    
    if (timeRemaining < extendThreshold) {
      await ctx.db.patch(args.auctionId, {
        auctionConfig: {
          ...auction.auctionConfig,
          endTime: auction.auctionConfig.endTime + extendThreshold,
        },
      });
    }

    return { success: true };
  },
});

// Seleccionar ganador de la subasta
export const selectWinner = mutation({
  args: {
    auctionId: v.id("auctions"),
    winnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) throw new Error("Subasta no encontrada");
    if (auction.clientId !== user._id) throw new Error("Solo el dueño puede seleccionar ganador");

    const winningBid = await ctx.db
      .query("bids")
      .withIndex("by_auction", (q) => q.eq("auctionId", args.auctionId))
      .filter((q) => q.eq(q.field("bidderId"), args.winnerId))
      .first();

    if (!winningBid) throw new Error("El usuario seleccionado no tiene puja");

    const now = Date.now();

    // Actualizar subasta
    await ctx.db.patch(args.auctionId, {
      status: "closed",
      winnerId: args.winnerId,
      updatedAt: now,
    });

    // Actualizar pujas
    const allBids = await ctx.db
      .query("bids")
      .withIndex("by_auction", (q) => q.eq("auctionId", args.auctionId))
      .collect();

    for (const bid of allBids) {
      await ctx.db.patch(bid._id, {
        status: bid.bidderId === args.winnerId ? "won" : "lost",
      });

      // Notificar a todos los postores
      await ctx.db.insert("notifications", {
        userId: bid.bidderId,
        type: bid.bidderId === args.winnerId ? "auction_won" : "auction_lost",
        title: bid.bidderId === args.winnerId 
          ? "¡Felicidades! Ganaste la subasta" 
          : "Subasta finalizada",
        message: bid.bidderId === args.winnerId
          ? `Has ganado "${auction.title}" con tu oferta de ${bid.amount}`
          : `La subasta "${auction.title}" ha sido asignada a otro postor`,
        data: { auctionId: args.auctionId },
        isRead: false,
        createdAt: now,
      });
    }

    // Crear el job asociado
    const jobId = await ctx.db.insert("jobs", {
      title: auction.title,
      description: auction.description,
      category: auction.category,
      budget: {
        min: winningBid.amount,
        max: winningBid.amount,
        currency: auction.initialOffer.currency,
      },
      clientId: auction.clientId,
      handymanId: args.winnerId,
      status: "assigned",
      location: auction.location,
      auctionId: args.auctionId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, jobId };
  },
});

// Cancelar subasta
export const cancelAuction = mutation({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    
    if (!user) throw new Error("Usuario no encontrado");

    const auction = await ctx.db.get(args.auctionId);
    if (!auction) throw new Error("Subasta no encontrada");
    if (auction.clientId !== user._id) throw new Error("Solo el dueño puede cancelar");
    if (auction.status !== "active") throw new Error("Solo se pueden cancelar subastas activas");

    await ctx.db.patch(args.auctionId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    // Notificar a los postores
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_auction", (q) => q.eq("auctionId", args.auctionId))
      .collect();

    for (const bid of bids) {
      await ctx.db.patch(bid._id, { status: "withdrawn" });
      await ctx.db.insert("notifications", {
        userId: bid.bidderId,
        type: "system",
        title: "Subasta cancelada",
        message: `La subasta "${auction.title}" ha sido cancelada por el cliente`,
        data: { auctionId: args.auctionId },
        isRead: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Incrementar contador de vistas
export const incrementViewCount = mutation({
  args: { auctionId: v.id("auctions") },
  handler: async (ctx, args) => {
    const auction = await ctx.db.get(args.auctionId);
    if (!auction) return;

    await ctx.db.patch(args.auctionId, {
      viewCount: (auction.viewCount || 0) + 1,
    });
  },
});

// ==================== HELPERS ====================

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
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


