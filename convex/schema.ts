import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("handyman"), 
      v.literal("client"), 
      v.literal("business"),
      v.literal("restaurant") // Nuevo rol para restaurantes
    ),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    })),
    skills: v.optional(v.array(v.string())),
    categories: v.optional(v.array(v.string())),
    rating: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
    bio: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    availability: v.optional(v.string()),
    completedJobs: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Auth0 integration fields
    tokenIdentifier: v.optional(v.string()),
    auth0Id: v.optional(v.string()),
    // Push notification token
    pushToken: v.optional(v.string()),
    pushTokenUpdatedAt: v.optional(v.number()),
    // Restaurant specific fields
    restaurantInfo: v.optional(v.object({
      businessName: v.string(),
      cuisine: v.array(v.string()),
      openingHours: v.object({
        monday: v.optional(v.object({ open: v.string(), close: v.string() })),
        tuesday: v.optional(v.object({ open: v.string(), close: v.string() })),
        wednesday: v.optional(v.object({ open: v.string(), close: v.string() })),
        thursday: v.optional(v.object({ open: v.string(), close: v.string() })),
        friday: v.optional(v.object({ open: v.string(), close: v.string() })),
        saturday: v.optional(v.object({ open: v.string(), close: v.string() })),
        sunday: v.optional(v.object({ open: v.string(), close: v.string() })),
      }),
      description: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      coverImageUrl: v.optional(v.string()),
    })),
  }).index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_verified", ["isVerified"])
    .index("by_token", ["tokenIdentifier"]),

  // ==================== SISTEMA DE SUBASTAS ====================
  
  // Trabajos/Servicios con sistema de subasta
  auctions: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    // El cliente propone un precio inicial
    initialOffer: v.object({
      amount: v.number(),
      currency: v.string(),
    }),
    // Precio actual más bajo/mejor oferta
    currentBestBid: v.optional(v.object({
      amount: v.number(),
      bidderId: v.id("users"),
      bidTime: v.number(),
    })),
    clientId: v.id("users"),
    winnerId: v.optional(v.id("users")),
    status: v.union(
      v.literal("active"),      // Subasta en curso
      v.literal("closed"),      // Subasta cerrada, ganador seleccionado
      v.literal("expired"),     // Expiró sin ofertas
      v.literal("cancelled"),   // Cancelada por el cliente
      v.literal("completed")    // Trabajo completado
    ),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    images: v.optional(v.array(v.string())),
    isUrgent: v.optional(v.boolean()),
    // Configuración de la subasta
    auctionConfig: v.object({
      // Tiempo límite de la subasta
      endTime: v.number(),
      // Tipo de subasta: reverse (gana el menor) o standard (gana el mayor)
      type: v.union(v.literal("reverse"), v.literal("standard")),
      // Mínimo decremento/incremento por puja
      minBidStep: v.optional(v.number()),
      // Extensión automática si hay puja en últimos minutos
      autoExtendMinutes: v.optional(v.number()),
    }),
    // Estadísticas
    totalBids: v.optional(v.number()),
    viewCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_client", ["clientId"])
    .index("by_category", ["category"])
    .index("by_end_time", ["auctionConfig.endTime"])
    .index("by_winner", ["winnerId"]),

  // Pujas/Ofertas de los trabajadores
  bids: defineTable({
    auctionId: v.id("auctions"),
    bidderId: v.id("users"), // Handyman que hace la puja
    amount: v.number(),
    currency: v.string(),
    message: v.optional(v.string()), // Mensaje opcional del trabajador
    estimatedTime: v.optional(v.string()), // Tiempo estimado de trabajo
    status: v.union(
      v.literal("active"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("withdrawn")
    ),
    createdAt: v.number(),
  }).index("by_auction", ["auctionId"])
    .index("by_bidder", ["bidderId"])
    .index("by_amount", ["auctionId", "amount"])
    .index("by_status", ["status"]),

  // ==================== OFERTAS FLASH DE RESTAURANTES ====================
  
  flashDeals: defineTable({
    restaurantId: v.id("users"),
    title: v.string(),
    description: v.string(),
    // Producto/Menú en oferta
    items: v.array(v.object({
      name: v.string(),
      originalPrice: v.number(),
      discountedPrice: v.number(),
      quantity: v.optional(v.number()), // Cantidad disponible
      imageUrl: v.optional(v.string()),
    })),
    // Descuento general
    discountPercentage: v.number(),
    // Ventana de tiempo de la oferta
    startTime: v.number(),
    endTime: v.number(), // Ej: hora de cierre del restaurante
    // Estado
    status: v.union(
      v.literal("scheduled"),  // Programada para futuro
      v.literal("active"),     // Activa ahora
      v.literal("expired"),    // Expiró
      v.literal("sold_out"),   // Agotada
      v.literal("cancelled")   // Cancelada
    ),
    // Ubicación del restaurante
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    // Radio de alcance para notificaciones (km)
    notificationRadius: v.optional(v.number()),
    // Estadísticas
    viewCount: v.optional(v.number()),
    claimCount: v.optional(v.number()),
    // Si ya se enviaron las notificaciones push
    pushNotificationSent: v.optional(v.boolean()),
    pushNotificationSentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_restaurant", ["restaurantId"])
    .index("by_status", ["status"])
    .index("by_end_time", ["endTime"])
    .index("by_start_time", ["startTime"]),

  // Claims/Reservas de ofertas flash
  flashDealClaims: defineTable({
    dealId: v.id("flashDeals"),
    userId: v.id("users"),
    items: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),    // Esperando confirmación
      v.literal("confirmed"),  // Confirmado
      v.literal("picked_up"),  // Recogido
      v.literal("cancelled"),  // Cancelado
      v.literal("expired")     // Expiró sin recoger
    ),
    pickupCode: v.optional(v.string()), // Código para recoger
    confirmedAt: v.optional(v.number()),
    pickedUpAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_deal", ["dealId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ==================== NOTIFICACIONES PUSH ====================
  
  pushNotifications: defineTable({
    // Puede ser para un usuario específico o broadcast
    targetType: v.union(
      v.literal("user"),      // Usuario específico
      v.literal("role"),      // Todos los usuarios de un rol
      v.literal("radius"),    // Usuarios en un radio geográfico
      v.literal("broadcast")  // Todos los usuarios
    ),
    targetUserId: v.optional(v.id("users")),
    targetRole: v.optional(v.string()),
    targetLocation: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      radiusKm: v.number(),
    })),
    // Contenido de la notificación
    title: v.string(),
    body: v.string(),
    imageUrl: v.optional(v.string()),
    // Datos adicionales para la app
    data: v.optional(v.object({
      type: v.string(), // "flash_deal", "auction_update", "bid_received", etc.
      referenceId: v.optional(v.string()),
      action: v.optional(v.string()),
    })),
    // Estado de envío
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("partial") // Algunos enviados, algunos fallaron
    ),
    sentCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
    scheduledFor: v.optional(v.number()), // Para notificaciones programadas
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_target_user", ["targetUserId"])
    .index("by_scheduled", ["scheduledFor"]),

  // ==================== TABLAS EXISTENTES ACTUALIZADAS ====================

  userDocuments: defineTable({
    userId: v.id("users"),
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    documentType: v.union(
      v.literal("profile_photo"),
      v.literal("id_front"),
      v.literal("id_back"),
      v.literal("criminal_record"),
      v.literal("certification"),
      v.literal("business_license"),
      v.literal("tax_certificate"),
      v.literal("insurance"),
      v.literal("food_license"), // Licencia de manipulación de alimentos
      v.literal("health_permit"), // Permiso sanitario
      v.literal("other")
    ),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    verificationNotes: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    uploadedAt: v.number(),
    metadata: v.optional(v.object({
      verificationStatus: v.optional(v.string()),
      expiryDate: v.optional(v.number()),
      issuedBy: v.optional(v.string()),
    })),
  }).index("by_user", ["userId"])
    .index("by_type", ["documentType"])
    .index("by_status", ["verificationStatus"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("job_match"),
      v.literal("proposal_received"),
      v.literal("job_assigned"),
      v.literal("message"),
      v.literal("system"),
      v.literal("auction_new_bid"),      // Nueva puja en tu subasta
      v.literal("auction_outbid"),       // Alguien superó tu puja
      v.literal("auction_won"),          // Ganaste la subasta
      v.literal("auction_lost"),         // Perdiste la subasta
      v.literal("auction_ending"),       // Subasta por terminar
      v.literal("flash_deal"),           // Nueva oferta flash cerca
      v.literal("flash_deal_claimed"),   // Tu oferta fue reclamada
      v.literal("flash_deal_expiring")   // Tu oferta está por expirar
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId", "isRead"])
    .index("by_type", ["type"]),

  jobs: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    budget: v.object({
      min: v.number(),
      max: v.number(),
      currency: v.string(),
    }),
    clientId: v.id("users"),
    handymanId: v.optional(v.id("users")),
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    isUrgent: v.optional(v.boolean()),
    deadline: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    finalPrice: v.optional(v.number()),
    // Enlace a subasta si fue creado como subasta
    auctionId: v.optional(v.id("auctions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_client", ["clientId"])
    .index("by_handyman", ["handymanId"])
    .index("by_category", ["category"])
    .index("by_auction", ["auctionId"]),

  jobProposals: defineTable({
    jobId: v.id("jobs"),
    handymanId: v.id("users"),
    proposedPrice: v.number(),
    estimatedDuration: v.optional(v.string()),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_job", ["jobId"])
    .index("by_handyman", ["handymanId"])
    .index("by_status", ["status"]),

  reviews: defineTable({
    jobId: v.optional(v.id("jobs")),
    auctionId: v.optional(v.id("auctions")),
    flashDealId: v.optional(v.id("flashDeals")),
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
    reviewType: v.union(
      v.literal("client_to_handyman"),
      v.literal("handyman_to_client"),
      v.literal("customer_to_restaurant"),
      v.literal("restaurant_to_customer")
    ),
    createdAt: v.number(),
  }).index("by_reviewee", ["revieweeId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_job", ["jobId"])
    .index("by_auction", ["auctionId"])
    .index("by_type", ["reviewType"]),

  favorites: defineTable({
    userId: v.id("users"),
    targetId: v.id("users"),
    targetType: v.union(
      v.literal("handyman"),
      v.literal("job"),
      v.literal("restaurant")
    ),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_target", ["targetId"])
    .index("by_user_type", ["userId", "targetType"]),

  paymentMethods: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("credit_card"),
      v.literal("debit_card"),
      v.literal("bank_account"),
      v.literal("digital_wallet")
    ),
    provider: v.string(),
    lastFourDigits: v.string(),
    holderName: v.string(),
    expiryMonth: v.optional(v.number()),
    expiryYear: v.optional(v.number()),
    isDefault: v.boolean(),
    isActive: v.boolean(),
    metadata: v.optional(v.object({
      token: v.optional(v.string()),
      fingerprint: v.optional(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_default", ["userId", "isDefault"]),

  payments: defineTable({
    jobId: v.optional(v.id("jobs")),
    auctionId: v.optional(v.id("auctions")),
    flashDealClaimId: v.optional(v.id("flashDealClaims")),
    payerId: v.id("users"),
    receiverId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paymentMethodId: v.id("paymentMethods"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    transactionId: v.optional(v.string()),
    gatewayResponse: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_job", ["jobId"])
    .index("by_auction", ["auctionId"])
    .index("by_payer", ["payerId"])
    .index("by_receiver", ["receiverId"])
    .index("by_status", ["status"]),

  messages: defineTable({
    conversationId: v.string(),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system")
    ),
    attachmentUrl: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageAt: v.number(),
    jobId: v.optional(v.id("jobs")),
    auctionId: v.optional(v.id("auctions")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_participants", ["participants"])
    .index("by_job", ["jobId"])
    .index("by_auction", ["auctionId"]),

  helpArticles: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_category", ["category"])
    .index("by_published", ["isPublished"]),

  supportTickets: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    description: v.string(),
    category: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"]),
});
