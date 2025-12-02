import { mutation } from "./_generated/server";

export const seedComprehensiveData = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if data already exists
        const existingUsers = await ctx.db.query("users").collect();
        if (existingUsers.length > 0) {
            return { message: "Data already seeded", skipped: true };
        }

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

        // ========== USERS ==========
        // Clients
        const client1 = await ctx.db.insert("users", {
            name: "María García",
            email: "maria.garcia@example.com",
            role: "client",
            phone: "+57 300 123 4567",
            location: {
                lat: 4.6097,
                lng: -74.0817,
                address: "Calle 72 #10-34, Chapinero, Bogotá",
            },
            createdAt: oneWeekAgo,
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
                address: "Carrera 43A #1-50, El Poblado, Medellín",
            },
            createdAt: oneWeekAgo,
            updatedAt: now,
        });

        const client3 = await ctx.db.insert("users", {
            name: "Laura Martínez",
            email: "laura.martinez@example.com",
            role: "client",
            phone: "+57 302 345 6789",
            location: {
                lat: 4.7110,
                lng: -74.0721,
                address: "Calle 127 #15-20, Usaquén, Bogotá",
            },
            createdAt: oneWeekAgo,
            updatedAt: now,
        });

        // Handymen
        const handyman1 = await ctx.db.insert("users", {
            name: "Juan Pérez",
            email: "juan.perez@example.com",
            role: "handyman",
            phone: "+57 303 456 7890",
            location: {
                lat: 4.6097,
                lng: -74.0817,
                address: "Calle 45 #12-23, Teusaquillo, Bogotá",
            },
            skills: ["Plomería", "Electricidad", "Carpintería", "Reparaciones generales"],
            categories: ["Plomería", "Electricidad"],
            rating: 4.8,
            isVerified: true,
            verifiedAt: oneWeekAgo,
            bio: "Plomero y electricista certificado con 10 años de experiencia. Trabajo rápido, limpio y garantizado. Disponible para emergencias.",
            hourlyRate: 50000,
            currency: "COP",
            availability: "Lunes a Sábado, 8am - 6pm",
            completedJobs: 127,
            createdAt: oneWeekAgo,
            updatedAt: now,
        });

        const handyman2 = await ctx.db.insert("users", {
            name: "Ana Martínez",
            email: "ana.martinez@example.com",
            role: "handyman",
            phone: "+57 304 567 8901",
            location: {
                lat: 6.2442,
                lng: -75.5812,
                address: "Carrera 70 #52-20, Laureles, Medellín",
            },
            skills: ["Pintura", "Decoración", "Reparaciones", "Limpieza profunda"],
            categories: ["Pintura", "Limpieza"],
            rating: 4.9,
            isVerified: true,
            verifiedAt: oneWeekAgo,
            bio: "Pintora profesional especializada en interiores y exteriores. Atención personalizada y acabados de alta calidad.",
            hourlyRate: 45000,
            currency: "COP",
            availability: "Lunes a Viernes, 9am - 5pm",
            completedJobs: 89,
            createdAt: oneWeekAgo,
            updatedAt: now,
        });

        const handyman3 = await ctx.db.insert("users", {
            name: "Pedro López",
            email: "pedro.lopez@example.com",
            role: "handyman",
            phone: "+57 305 678 9012",
            location: {
                lat: 4.6097,
                lng: -74.0817,
                address: "Avenida 68 #23-45, Engativá, Bogotá",
            },
            skills: ["Carpintería", "Instalación de muebles", "Reparaciones", "Cerrajería"],
            categories: ["Carpintería"],
            rating: 4.7,
            isVerified: true,
            verifiedAt: oneWeekAgo,
            bio: "Carpintero con especialidad en muebles a medida y reparaciones del hogar. 15 años de experiencia.",
            hourlyRate: 55000,
            currency: "COP",
            availability: "Lunes a Sábado, 7am - 7pm",
            completedJobs: 156,
            createdAt: oneWeekAgo,
            updatedAt: now,
        });

        const handyman4 = await ctx.db.insert("users", {
            name: "Sofia Ramírez",
            email: "sofia.ramirez@example.com",
            role: "handyman",
            phone: "+57 306 789 0123",
            location: {
                lat: 4.6097,
                lng: -74.0817,
                address: "Carrera 15 #85-40, Chicó, Bogotá",
            },
            skills: ["Jardinería", "Paisajismo", "Mantenimiento de jardines"],
            categories: ["Jardinería"],
            rating: 4.6,
            isVerified: true,
            verifiedAt: oneWeekAgo,
            bio: "Jardinera profesional con experiencia en diseño y mantenimiento de jardines residenciales y comerciales.",
            hourlyRate: 40000,
            currency: "COP",
            availability: "Martes a Domingo, 7am - 4pm",
            completedJobs: 72,
            createdAt: oneWeekAgo,
            updatedAt: now,
        });

        // ========== JOBS ==========
        // Job 1: Completed job with review
        const job1 = await ctx.db.insert("jobs", {
            title: "Reparación de fuga en baño",
            description: "Tengo una fuga en el lavamanos del baño principal. Necesito que alguien venga a revisarlo y repararlo lo antes posible.",
            category: "Plomería",
            budget: {
                min: 80000,
                max: 150000,
                currency: "COP",
            },
            clientId: client1,
            handymanId: handyman1,
            status: "completed",
            location: {
                lat: 4.6097,
                lng: -74.0817,
                address: "Calle 72 #10-34, Chapinero, Bogotá",
            },
            isUrgent: true,
            finalPrice: 120000,
            completedAt: twoDaysAgo,
            createdAt: oneWeekAgo,
            updatedAt: twoDaysAgo,
        });

        // Job 2: Open job with proposals
        const job2 = await ctx.db.insert("jobs", {
            title: "Pintura de sala y comedor",
            description: "Necesito pintar la sala y el comedor de mi apartamento. Son aproximadamente 40m². Prefiero colores claros y neutros.",
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
                address: "Carrera 43A #1-50, El Poblado, Medellín",
            },
            isUrgent: false,
            deadline: now + 7 * 24 * 60 * 60 * 1000,
            createdAt: oneDayAgo,
            updatedAt: oneDayAgo,
        });

        // Job 3: In progress
        const job3 = await ctx.db.insert("jobs", {
            title: "Instalación de lámpara en techo alto",
            description: "Necesito instalar una lámpara de araña en un techo de 4 metros de altura. Requiere escalera especial y experiencia en instalaciones eléctricas.",
            category: "Electricidad",
            budget: {
                min: 100000,
                max: 200000,
                currency: "COP",
            },
            clientId: client1,
            handymanId: handyman1,
            status: "in_progress",
            location: {
                lat: 4.6097,
                lng: -74.0817,
                address: "Calle 72 #10-34, Chapinero, Bogotá",
            },
            isUrgent: false,
            createdAt: oneDayAgo,
            updatedAt: now,
        });

        // Job 4: Open job
        const job4 = await ctx.db.insert("jobs", {
            title: "Reparación de puerta de closet",
            description: "La puerta de mi closet se salió de las guías y necesito que la reparen o reemplacen las piezas dañadas. Es una puerta corrediza de 2 metros.",
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
                address: "Carrera 43A #1-50, El Poblado, Medellín",
            },
            isUrgent: false,
            createdAt: oneDayAgo,
            updatedAt: oneDayAgo,
        });

        // Job 5: Urgent open job
        const job5 = await ctx.db.insert("jobs", {
            title: "Cambio de tomacorrientes urgente",
            description: "Necesito cambiar 5 tomacorrientes que están chispeando. Es urgente por seguridad. Prefiero que sea hoy mismo.",
            category: "Electricidad",
            budget: {
                min: 120000,
                max: 180000,
                currency: "COP",
            },
            clientId: client3,
            status: "open",
            location: {
                lat: 4.7110,
                lng: -74.0721,
                address: "Calle 127 #15-20, Usaquén, Bogotá",
            },
            isUrgent: true,
            createdAt: now - 2 * 60 * 60 * 1000, // 2 hours ago
            updatedAt: now - 2 * 60 * 60 * 1000,
        });

        // Job 6: Open job
        const job6 = await ctx.db.insert("jobs", {
            title: "Mantenimiento de jardín",
            description: "Necesito poda de árboles, corte de césped y limpieza general del jardín. Área aproximada de 100m².",
            category: "Jardinería",
            budget: {
                min: 150000,
                max: 250000,
                currency: "COP",
            },
            clientId: client3,
            status: "open",
            location: {
                lat: 4.7110,
                lng: -74.0721,
                address: "Calle 127 #15-20, Usaquén, Bogotá",
            },
            isUrgent: false,
            createdAt: oneDayAgo,
            updatedAt: oneDayAgo,
        });

        // ========== JOB PROPOSALS ==========
        // Proposals for job2 (Pintura)
        await ctx.db.insert("jobProposals", {
            jobId: job2,
            handymanId: handyman2,
            proposedPrice: 380000,
            estimatedDuration: "2-3 días",
            message: "Hola! Tengo 5 años de experiencia en pintura de interiores. Incluyo materiales de primera calidad y garantía de 1 año. Puedo empezar la próxima semana.",
            status: "pending",
            createdAt: now - 6 * 60 * 60 * 1000, // 6 hours ago
            updatedAt: now - 6 * 60 * 60 * 1000,
        });

        // Proposals for job4 (Carpintería)
        await ctx.db.insert("jobProposals", {
            jobId: job4,
            handymanId: handyman3,
            proposedPrice: 95000,
            estimatedDuration: "4-5 horas",
            message: "Especialista en puertas corredizas. Puedo reparar las guías o instalar nuevas si es necesario. Trabajo garantizado.",
            status: "pending",
            createdAt: now - 4 * 60 * 60 * 1000, // 4 hours ago
            updatedAt: now - 4 * 60 * 60 * 1000,
        });

        // Proposals for job5 (Electricidad urgente)
        await ctx.db.insert("jobProposals", {
            jobId: job5,
            handymanId: handyman1,
            proposedPrice: 150000,
            estimatedDuration: "2-3 horas",
            message: "Puedo ir hoy mismo en 2 horas. Electricista certificado con todas las herramientas necesarias.",
            status: "pending",
            createdAt: now - 1 * 60 * 60 * 1000, // 1 hour ago
            updatedAt: now - 1 * 60 * 60 * 1000,
        });

        // Proposals for job6 (Jardinería)
        await ctx.db.insert("jobProposals", {
            jobId: job6,
            handymanId: handyman4,
            proposedPrice: 200000,
            estimatedDuration: "1 día completo",
            message: "Jardinera profesional con equipo completo. Incluyo poda, corte y limpieza. Puedo ir este fin de semana.",
            status: "pending",
            createdAt: now - 3 * 60 * 60 * 1000, // 3 hours ago
            updatedAt: now - 3 * 60 * 60 * 1000,
        });

        // ========== REVIEWS ==========
        // Review for completed job1
        await ctx.db.insert("reviews", {
            jobId: job1,
            reviewerId: client1,
            revieweeId: handyman1,
            rating: 5,
            comment: "Excelente trabajo! Juan llegó puntual, identificó el problema rápidamente y lo solucionó en menos tiempo del esperado. Muy profesional y limpio. Lo recomiendo 100%.",
            reviewType: "client_to_handyman",
            createdAt: twoDaysAgo + 2 * 60 * 60 * 1000, // 2 hours after completion
        });

        await ctx.db.insert("reviews", {
            jobId: job1,
            reviewerId: handyman1,
            revieweeId: client1,
            rating: 5,
            comment: "Cliente muy amable y respetuoso. Comunicación clara sobre el problema. Pago puntual. Fue un placer trabajar para ella.",
            reviewType: "handyman_to_client",
            createdAt: twoDaysAgo + 3 * 60 * 60 * 1000, // 3 hours after completion
        });

        // ========== NOTIFICATIONS ==========
        await ctx.db.insert("notifications", {
            userId: client2,
            type: "proposal_received",
            title: "Nueva propuesta recibida",
            message: "Ana Martínez envió una propuesta para tu trabajo 'Pintura de sala y comedor'",
            data: { jobId: job2, proposalId: "proposal1" },
            isRead: false,
            createdAt: now - 6 * 60 * 60 * 1000,
        });

        await ctx.db.insert("notifications", {
            userId: client3,
            type: "proposal_received",
            title: "Nueva propuesta recibida",
            message: "Juan Pérez envió una propuesta para tu trabajo urgente 'Cambio de tomacorrientes'",
            data: { jobId: job5 },
            isRead: false,
            createdAt: now - 1 * 60 * 60 * 1000,
        });

        await ctx.db.insert("notifications", {
            userId: client1,
            type: "job_assigned",
            title: "Trabajo en progreso",
            message: "Juan Pérez comenzó a trabajar en 'Instalación de lámpara en techo alto'",
            data: { jobId: job3 },
            isRead: true,
            createdAt: now - 12 * 60 * 60 * 1000,
        });

        return {
            message: "Comprehensive seed data created successfully",
            users: 7,
            jobs: 6,
            proposals: 4,
            reviews: 2,
            notifications: 3,
        };
    },
});
