import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Obtener métodos de pago del usuario
export const getUserPaymentMethods = query({
  args: { userId: v.id("users") },
  handler: async (ctx: QueryCtx, args) => {
    const methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return methods.sort((a, b) => {
      // Poner el método predeterminado primero
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

// Agregar método de pago
export const addPaymentMethod = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("card"), v.literal("bank_account"), v.literal("digital_wallet")),
    last4: v.optional(v.string()),
    brand: v.optional(v.string()),
    expiryMonth: v.optional(v.string()),
    expiryYear: v.optional(v.string()),
    cardholderName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    walletType: v.optional(v.string()),
    email: v.optional(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const now = Date.now();

    // Si es el método predeterminado, quitar el flag de los demás
    if (args.isDefault) {
      const existingMethods = await ctx.db
        .query("paymentMethods")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      for (const method of existingMethods) {
        if (method.isDefault) {
          await ctx.db.patch(method._id, { isDefault: false });
        }
      }
    }

    // Crear el nuevo método de pago
    const paymentMethodId = await ctx.db.insert("paymentMethods", {
      userId: args.userId,
      type: args.type === "card" ? "credit_card" : args.type,
      lastFourDigits: args.last4 || "0000",
      provider: args.brand || "unknown",
      holderName: args.cardholderName || "Unknown",
      expiryMonth: args.expiryMonth ? parseInt(args.expiryMonth.toString()) : undefined,
      expiryYear: args.expiryYear ? parseInt(args.expiryYear.toString()) : undefined,
      isDefault: args.isDefault,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, paymentMethodId };
  },
});

// Eliminar método de pago
export const deletePaymentMethod = mutation({
  args: { paymentMethodId: v.id("paymentMethods") },
  handler: async (ctx: MutationCtx, args) => {
    const method = await ctx.db.get(args.paymentMethodId);
    if (!method) {
      throw new Error("Payment method not found");
    }

    // Si es el método predeterminado, asignar otro como predeterminado
    if (method.isDefault) {
      const otherMethods = await ctx.db
        .query("paymentMethods")
        .withIndex("by_user", (q) => q.eq("userId", method.userId))
        .collect();

      const anotherMethod = otherMethods.find(m => m._id !== args.paymentMethodId);
      if (anotherMethod) {
        await ctx.db.patch(anotherMethod._id, { isDefault: true });
      }
    }

    await ctx.db.delete(args.paymentMethodId);
    return { success: true };
  },
});

// Establecer método de pago predeterminado
export const setDefaultPaymentMethod = mutation({
  args: {
    userId: v.id("users"),
    paymentMethodId: v.id("paymentMethods"),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Quitar el flag predeterminado de todos los métodos
    const methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const method of methods) {
      if (method._id === args.paymentMethodId) {
        await ctx.db.patch(method._id, { 
          isDefault: true,
          updatedAt: Date.now(),
        });
      } else if (method.isDefault) {
        await ctx.db.patch(method._id, { 
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Procesar pago
export const processPayment = mutation({
  args: {
    userId: v.id("users"),
    handymanId: v.id("users"),
    jobId: v.id("jobs"),
    amount: v.number(),
    currency: v.string(),
    paymentMethodId: v.id("paymentMethods"),
    description: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const paymentMethod = await ctx.db.get(args.paymentMethodId);
    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    if (!paymentMethod.isActive) {
      throw new Error("Payment method is inactive");
    }

    const now = Date.now();

    // Crear transacción
    const transactionId = await ctx.db.insert("payments", {
      payerId: args.userId,
      receiverId: args.handymanId,
      jobId: args.jobId,
      paymentMethodId: args.paymentMethodId,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Simular procesamiento de pago (en producción, integrar con pasarela de pago)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Actualizar estado de transacción
    await ctx.db.patch(transactionId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Actualizar estado del trabajo
    await ctx.db.patch(args.jobId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return { 
      success: true, 
      transactionId,
      message: "Payment processed successfully",
    };
  },
});

// Obtener historial de transacciones
export const getUserTransactions = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    let query = ctx.db
      .query("payments")
      .withIndex("by_payer", (q) => q.eq("payerId", args.userId));

    const transactions = await query.collect();

    // Ordenar por fecha (más recientes primero)
    const sorted = transactions.sort((a, b) => b.createdAt - a.createdAt);

    // Limitar resultados si se especifica
    const limited = args.limit ? sorted.slice(0, args.limit) : sorted;

    // Enriquecer con información adicional
    const enriched = await Promise.all(
      limited.map(async (transaction) => {
        const job = await ctx.db.get(transaction.jobId);
        const paymentMethod = await ctx.db.get(transaction.paymentMethodId);
        
        return {
          ...transaction,
          jobTitle: job?.title,
          paymentMethodInfo: paymentMethod ? {
            type: paymentMethod.type,
            last4: paymentMethod.lastFourDigits,
            brand: paymentMethod.provider,
          } : null,
        };
      })
    );

    return enriched;
  },
});

// Solicitar reembolso
export const requestRefund = mutation({
  args: {
    transactionId: v.id("payments"),
    reason: v.string(),
    amount: v.optional(v.number()), // Para reembolsos parciales
  },
  handler: async (ctx: MutationCtx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "completed") {
      throw new Error("Can only refund completed transactions");
    }

    const now = Date.now();
    const refundAmount = args.amount || transaction.amount;

    // Crear transacción de reembolso
    const refundId = await ctx.db.insert("payments", {
      payerId: transaction.receiverId, // El handyman devuelve al cliente
      receiverId: transaction.payerId,
      jobId: transaction.jobId,
      paymentMethodId: transaction.paymentMethodId,
      amount: refundAmount,
      currency: transaction.currency,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Crear notificación
    await ctx.db.insert("notifications", {
      userId: transaction.userId,
      type: "system",
      title: "Reembolso Solicitado",
      message: `Tu solicitud de reembolso de ${refundAmount} ${transaction.currency} está siendo procesada.`,
      isRead: false,
      createdAt: now,
    });

    return { 
      success: true, 
      refundId,
      message: "Refund request submitted successfully",
    };
  },
});

// Obtener estadísticas de pagos
export const getPaymentStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx: QueryCtx, args) => {
    const transactions = await ctx.db
      .query("payments")
      .withIndex("by_payer", (q) => q.eq("payerId", args.userId))
      .collect();

    const stats = {
      totalTransactions: transactions.length,
      totalSpent: 0,
      totalEarned: 0,
      pendingPayments: 0,
      completedPayments: 0,
      refunds: 0,
    };

    for (const transaction of transactions) {
      if (transaction.type === "payment") {
        if (transaction.status === "completed") {
          stats.totalSpent += transaction.amount;
          stats.completedPayments++;
        } else if (transaction.status === "pending") {
          stats.pendingPayments++;
        }
      } else if (transaction.type === "refund" && transaction.status === "completed") {
        stats.refunds += transaction.amount;
      }
    }

    return stats;
  },
});