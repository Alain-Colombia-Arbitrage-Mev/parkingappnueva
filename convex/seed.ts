import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { message: "Data already seeded", skipped: true };
    }

    const now = Date.now();

    // Create mock clients
    const client1 = await ctx.db.insert("users", {
      name: "María García",
      email: "maria.garcia@example.com",
      role: "client",
      phone: "+57 300 123 4567",
      location: {
        lat: 4.6097,
        lng: -74.0817,
        address: "Calle 72 #10-34, Bogotá",
      },
      createdAt: now,
      updatedAt: now,
    });

    const client2 = await ctx.db.insert("users", {
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@example.com",
      role: "client",
      phone: "+57 301 234 5678",
      location: {
        lat: 6.2442,
        lng: -75.5812,
        address: "Carrera 43A #1-50, Medellín",
      },
      createdAt: now,
      updatedAt: now,
    });

    // Create mock handymen
    const handyman1 = await ctx.db.insert("users", {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      role: "handyman",
      phone: "+57 302 345 6789",
      location: {
        lat: 4.6097,
        lng: -74.0817,
        address: "Calle 45 #12-23, Bogotá",
      },
      skills: ["Plomería", "Electricidad", "Carpintería"],
      categories: ["Plomería", "Electricidad"],
      rating: 4.8,
      isVerified: true,
      verifiedAt: now,
      bio: "Plomero y electricista con 10 años de experiencia. Trabajo rápido y garantizado.",
      hourlyRate: 50000,
      currency: "COP",
      availability: "Lunes a Sábado, 8am - 6pm",
      completedJobs: 127,
      createdAt: now,
      updatedAt: now,
    });

    const handyman2 = await ctx.db.insert("users", {
      name: "Ana Martínez",
      email: "ana.martinez@example.com",
      role: "handyman",
      phone: "+57 303 456 7890",
      location: {
        lat: 6.2442,
        lng: -75.5812,
        address: "Carrera 70 #52-20, Medellín",
      },
      skills: ["Pintura", "Reparaciones generales", "Limpieza"],
      categories: ["Pintura", "Limpieza"],
      rating: 4.9,
      isVerified: true,
      verifiedAt: now,
      bio: "Pintora profesional especializada en interiores y exteriores. Atención personalizada.",
      hourlyRate: 45000,
      currency: "COP",
      availability: "Lunes a Viernes, 9am - 5pm",
      completedJobs: 89,
      createdAt: now,
      updatedAt: now,
    });

    const handyman3 = await ctx.db.insert("users", {
      name: "Pedro López",
      email: "pedro.lopez@example.com",
      role: "handyman",
      phone: "+57 304 567 8901",
      location: {
        lat: 4.6097,
        lng: -74.0817,
        address: "Avenida 68 #23-45, Bogotá",
      },
      skills: ["Carpintería", "Instalación de muebles", "Reparaciones"],
      categories: ["Carpintería"],
      rating: 4.7,
      isVerified: true,
      verifiedAt: now,
      bio: "Carpintero con especialidad en muebles a medida y reparaciones del hogar.",
      hourlyRate: 55000,
      currency: "COP",
      availability: "Lunes a Sábado, 7am - 7pm",
      completedJobs: 156,
      createdAt: now,
      updatedAt: now,
    });

    // Create mock jobs
    await ctx.db.insert("jobs", {
      title: "Reparación de fuga en baño",
      description: "Tengo una fuga en el lavamanos del baño principal. Necesito que alguien venga a revisarlo y repararlo lo antes posible.",
      category: "Plomería",
      budget: {
        min: 80000,
        max: 150000,
        currency: "COP",
      },
      clientId: client1,
      status: "open",
      location: {
        lat: 4.6097,
        lng: -74.0817,
        address: "Calle 72 #10-34, Bogotá",
      },
      isUrgent: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("jobs", {
      title: "Pintura de sala y comedor",
      description: "Necesito pintar la sala y el comedor de mi apartamento. Son aproximadamente 40m². Prefiero colores claros.",
      category: "Pintura",
      budget: {
        min: 300000,
        max: 500000,
        currency: "COP",
      },
      clientId: client2,
      status: "open",
      location: {
        lat: 6.2442,
        lng: -75.5812,
        address: "Carrera 43A #1-50, Medellín",
      },
      isUrgent: false,
      deadline: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("jobs", {
      title: "Instalación de lámpara en techo alto",
      description: "Necesito instalar una lámpara de araña en un techo de 4 metros de altura. Requiere escalera especial.",
      category: "Electricidad",
      budget: {
        min: 100000,
        max: 200000,
        currency: "COP",
      },
      clientId: client1,
      status: "open",
      location: {
        lat: 4.6097,
        lng: -74.0817,
        address: "Calle 72 #10-34, Bogotá",
      },
      isUrgent: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("jobs", {
      title: "Reparación de puerta de closet",
      description: "La puerta de mi closet se salió de las guías y necesito que la reparen o reemplacen las piezas dañadas.",
      category: "Carpintería",
      budget: {
        min: 60000,
        max: 120000,
        currency: "COP",
      },
      clientId: client2,
      status: "open",
      location: {
        lat: 6.2442,
        lng: -75.5812,
        address: "Carrera 43A #1-50, Medellín",
      },
      isUrgent: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("jobs", {
      title: "Cambio de tomacorrientes",
      description: "Necesito cambiar 5 tomacorrientes antiguos por unos modernos con puerto USB.",
      category: "Electricidad",
      budget: {
        min: 120000,
        max: 180000,
        currency: "COP",
      },
      clientId: client1,
      status: "open",
      location: {
        lat: 4.6097,
        lng: -74.0817,
        address: "Calle 72 #10-34, Bogotá",
      },
      isUrgent: false,
      createdAt: now,
      updatedAt: now,
    });

    return {
      message: "Seed data created successfully",
      users: 5,
      jobs: 5,
    };
  },
});
