import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/services/convex_service.dart';
import 'core/services/auth0_service.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/signup_screen.dart';
import 'features/jobs/jobs_screen.dart';
import 'features/welcome/welcome_screen.dart';
import 'features/onboarding/role_selection_screen.dart';
import 'features/onboarding/handyman_onboarding_screen.dart';
import 'features/auctions/auction_list_screen.dart';
import 'features/flash_deals/flash_deals_screen.dart';

// Convex Configuration
const convexUrl = 'https://terrific-starling-996.convex.cloud';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializar con manejo de errores
  ConvexClient? convexClient;
  
  try {
    convexClient = await ConvexClient.init(
      deploymentUrl: convexUrl,
      clientId: 'handyman-app',
    );
  } catch (e) {
    debugPrint('Error initializing Convex: $e');
    // Continuar sin Convex para debug
  }

  runApp(ProviderScope(
    overrides: [
      if (convexClient != null)
        convexClientProvider.overrideWithValue(convexClient),
    ],
    child: const MyApp(),
  ));
}

/// User status provider - checks if user needs onboarding
final userStatusProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final authState = ref.watch(auth0StateProvider);
  if (!authState.isAuthenticated) return null;
  
  final convexService = ref.read(convexServiceProvider);
  if (convexService == null) return null;
  
  try {
    return await convexService.checkUserStatus();
  } catch (e) {
    debugPrint('Error checking user status: $e');
    return null;
  }
});

/// Router with authentication and onboarding redirect
final _routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(auth0StateProvider);
  
  return GoRouter(
  initialLocation: '/welcome',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final currentPath = state.matchedLocation;
      
      // Auth routes that don't require authentication
      final authRoutes = ['/welcome', '/login', '/signup'];
      final isAuthRoute = authRoutes.contains(currentPath);
      
      // Still loading, don't redirect
      if (isLoading) return null;
      
      // Not authenticated and trying to access protected route
      if (!isAuthenticated && !isAuthRoute) {
        return '/welcome';
      }
      
      // Authenticated but on welcome/login/signup, redirect to role selection or home
      // The actual check for onboarding happens in the role selection screen
      if (isAuthenticated && isAuthRoute) {
        return '/onboarding/role';
      }
      
      return null;
    },
  routes: [
      // Public routes
    GoRoute(
      path: '/welcome',
      builder: (context, state) => const WelcomeScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignupScreen(),
    ),
      
      // Onboarding routes
      GoRoute(
        path: '/onboarding/role',
        builder: (context, state) => const RoleSelectionScreen(),
      ),
      GoRoute(
        path: '/onboarding/handyman',
        builder: (context, state) => const HandymanOnboardingScreen(),
      ),
      
      // Protected routes
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
    GoRoute(
      path: '/jobs',
      builder: (context, state) => const JobsScreen(),
    ),
      
      // Auctions routes
      GoRoute(
        path: '/auctions',
        builder: (context, state) => const AuctionListScreen(),
      ),
      
      // Flash deals routes
      GoRoute(
        path: '/flash-deals',
        builder: (context, state) => const FlashDealsScreen(),
      ),
    ],
  );
});

class MyApp extends ConsumerStatefulWidget {
  const MyApp({super.key});

  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  @override
  void initState() {
    super.initState();
    // Initialize Auth0 state on app start
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(auth0StateProvider.notifier).initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(_routerProvider);
    
    return MaterialApp.router(
      title: 'Handyman Auction',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2563EB),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: 'SF Pro Display',
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          filled: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
        cardTheme: CardThemeData(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2563EB),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        fontFamily: 'SF Pro Display',
      ),
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(auth0StateProvider);
    final user = authState.user;
    final userStatus = ref.watch(userStatusProvider);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Parkiing'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Navigate to notifications
            },
          ),
          PopupMenuButton<String>(
            icon: CircleAvatar(
              radius: 16,
              backgroundImage: user?.pictureUrl != null 
                  ? NetworkImage(user!.pictureUrl!.toString())
                  : null,
              child: user?.pictureUrl == null 
                  ? const Icon(Icons.person, size: 20)
                  : null,
            ),
            onSelected: (value) async {
              if (value == 'logout') {
                await ref.read(auth0StateProvider.notifier).logout();
                context.go('/welcome');
              } else if (value == 'profile') {
                // TODO: Navigate to profile
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    const Icon(Icons.person_outline),
                    const SizedBox(width: 8),
                    Text('Perfil'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.red.shade400),
                    const SizedBox(width: 8),
                    Text('Cerrar Sesión', style: TextStyle(color: Colors.red.shade400)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: userStatus.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(userStatusProvider),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
        data: (status) {
          if (status == null || status['needsOnboarding'] == true) {
            // Redirect to onboarding
            WidgetsBinding.instance.addPostFrameCallback((_) {
              context.go('/onboarding/role');
            });
            return const Center(child: CircularProgressIndicator());
          }

          final userData = status['user'] as Map<String, dynamic>?;
          final role = userData?['role'] as String?;

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(userStatusProvider);
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Welcome card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: role == 'handyman'
                            ? [Colors.orange.shade400, Colors.orange.shade600]
                            : [Colors.blue.shade400, Colors.blue.shade600],
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: (role == 'handyman' ? Colors.orange : Colors.blue).withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (user?.pictureUrl != null)
                              CircleAvatar(
                                radius: 28,
                                backgroundImage: NetworkImage(user!.pictureUrl!.toString()),
                              )
                            else
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: Colors.white.withOpacity(0.2),
                                child: const Icon(Icons.person, color: Colors.white),
                              ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '¡Hola, ${user?.name?.split(' ').first ?? 'Usuario'}!',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      role == 'handyman' ? '🔧 Profesional' : '👤 Cliente',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
            const SizedBox(height: 20),
                        Text(
                          role == 'handyman'
                              ? 'Encuentra nuevos trabajos cerca de ti'
                              : 'Encuentra el profesional perfecto para tu proyecto',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Quick actions
                  Text(
                    'Acciones rápidas',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  if (role == 'client') ...[
                    _QuickActionCard(
                      icon: Icons.gavel,
                      title: 'Crear Subasta',
                      subtitle: 'Publica tu trabajo y recibe ofertas competitivas',
                      color: Colors.blue,
                      onTap: () => context.push('/auctions'),
                    ),
                    const SizedBox(height: 12),
                    _QuickActionCard(
                      icon: Icons.search,
                      title: 'Buscar Profesionales',
                      subtitle: 'Explora handymen verificados',
                      color: Colors.green,
                      onTap: () {
                        // TODO: Navigate to search
                      },
                    ),
                  ] else if (role == 'handyman') ...[
                    _QuickActionCard(
                      icon: Icons.gavel,
                      title: 'Ver Subastas',
                      subtitle: 'Puja en trabajos y gana proyectos',
                      color: Colors.orange,
                      onTap: () => context.push('/auctions'),
                    ),
                    const SizedBox(height: 12),
                    _QuickActionCard(
                      icon: Icons.work_outline,
                      title: 'Ver Trabajos Disponibles',
                      subtitle: 'Encuentra trabajos cerca de ti',
                      color: Colors.purple,
                      onTap: () => context.go('/jobs'),
                    ),
                  ] else if (role == 'restaurant') ...[
                    _QuickActionCard(
                      icon: Icons.local_fire_department,
                      title: 'Crear Oferta Flash',
                      subtitle: 'Promociona tu comida antes del cierre',
                      color: Colors.red,
                      onTap: () => context.push('/flash-deals'),
                    ),
                    const SizedBox(height: 12),
                    _QuickActionCard(
                      icon: Icons.receipt_long,
                      title: 'Mis Ofertas',
                      subtitle: 'Gestiona tus promociones activas',
                      color: Colors.orange,
                      onTap: () => context.push('/flash-deals'),
                    ),
                  ],
                  
                  // Ofertas Flash para todos (excepto restaurantes)
                  if (role != 'restaurant') ...[
                    const SizedBox(height: 12),
                    _QuickActionCard(
                      icon: Icons.local_fire_department,
                      title: 'Ofertas Flash',
                      subtitle: 'Descuentos de última hora cerca de ti',
                      color: Colors.red,
                      onTap: () => context.push('/flash-deals'),
                    ),
                  ],
                  
                  const SizedBox(height: 12),
                  _QuickActionCard(
                    icon: Icons.message_outlined,
                    title: 'Mensajes',
                    subtitle: 'Revisa tus conversaciones',
                    color: Colors.teal,
                    onTap: () {
                      // TODO: Navigate to messages
                    },
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Status card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.check_circle, color: Colors.green),
                              const SizedBox(width: 8),
                              const Text(
                                'Estado de la cuenta',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildStatusRow('Auth0', 'Conectado', true),
                          _buildStatusRow('Convex', 'Sincronizado', true),
                          _buildStatusRow(
                            'Verificación',
                            userData?['isVerified'] == true ? 'Verificado' : 'Pendiente',
                            userData?['isVerified'] == true,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusRow(String label, String value, bool isActive) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isActive ? Colors.green : Colors.orange,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                value,
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: isActive ? Colors.green.shade700 : Colors.orange.shade700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }
}
