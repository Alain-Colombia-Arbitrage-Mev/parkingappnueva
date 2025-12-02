import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/auth0_service.dart';
import '../../core/services/convex_service.dart';

class RoleSelectionScreen extends ConsumerStatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  ConsumerState<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends ConsumerState<RoleSelectionScreen> {
  String? _selectedRole;
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _continueWithRole() async {
    if (_selectedRole == null) {
      setState(() {
        _errorMessage = 'Por favor selecciona cómo quieres usar la app';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final convexService = ref.read(convexServiceProvider);
      
      if (_selectedRole == 'handyman') {
        // Handyman goes to additional onboarding
        if (mounted) context.go('/onboarding/handyman');
      } else {
        // Client/Business can proceed with basic setup
        if (convexService != null) {
          await convexService.createUserWithRole(role: _selectedRole!);
        }
        if (mounted) context.go('/');
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(auth0StateProvider);
    final user = authState.user;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colorScheme.primary.withOpacity(0.05),
              colorScheme.surface,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                const SizedBox(height: 24),
                
                // User greeting
                if (user?.pictureUrl != null) ...[
                  CircleAvatar(
                    radius: 40,
                    backgroundImage: NetworkImage(user!.pictureUrl!.toString()),
                  ).animate().fadeIn().scale(delay: 100.ms),
                  const SizedBox(height: 16),
                ],
                
                Text(
                  '¡Hola, ${user?.name?.split(' ').first ?? 'Usuario'}!',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ).animate().fadeIn(delay: 200.ms),
                
                const SizedBox(height: 8),
                
                Text(
                  '¿Cómo quieres usar Parkiing?',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 300.ms),
                
                const SizedBox(height: 32),
                
                // Error message
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: colorScheme.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: colorScheme.error),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(color: colorScheme.error),
                          ),
                        ),
                      ],
                    ),
                  ),
                
                // Role cards
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        _RoleOptionCard(
                          icon: Icons.search,
                          title: 'Busco un Profesional',
                          subtitle: 'Necesito contratar servicios de handyman para mi hogar o negocio',
                          features: const [
                            'Publica trabajos y recibe propuestas',
                            'Compara precios y reseñas',
                            'Pago seguro a través de la app',
                            'Garantía de satisfacción',
                          ],
                          role: 'client',
                          isSelected: _selectedRole == 'client',
                          onTap: () => setState(() => _selectedRole = 'client'),
                          gradient: LinearGradient(
                            colors: [Colors.blue.shade400, Colors.blue.shade600],
                          ),
                        ).animate().fadeIn(delay: 400.ms).slideX(begin: -0.1),
                        
                        const SizedBox(height: 16),
                        
                        _RoleOptionCard(
                          icon: Icons.handyman,
                          title: 'Soy Profesional',
                          subtitle: 'Quiero ofrecer mis servicios y encontrar clientes',
                          features: const [
                            'Recibe trabajos cerca de ti',
                            'Establece tus propios precios',
                            'Construye tu reputación',
                            'Retiro de ganancias fácil',
                          ],
                          role: 'handyman',
                          isSelected: _selectedRole == 'handyman',
                          onTap: () => setState(() => _selectedRole = 'handyman'),
                          gradient: LinearGradient(
                            colors: [Colors.orange.shade400, Colors.orange.shade600],
                          ),
                        ).animate().fadeIn(delay: 500.ms).slideX(begin: 0.1),
                        
                        const SizedBox(height: 16),
                        
                        _RoleOptionCard(
                          icon: Icons.business,
                          title: 'Soy Empresa',
                          subtitle: 'Gestiono un equipo de profesionales',
                          features: const [
                            'Gestiona múltiples profesionales',
                            'Dashboard de administración',
                            'Reportes y analytics',
                            'Facturación empresarial',
                          ],
                          role: 'business',
                          isSelected: _selectedRole == 'business',
                          onTap: () => setState(() => _selectedRole = 'business'),
                          gradient: LinearGradient(
                            colors: [Colors.purple.shade400, Colors.purple.shade600],
                          ),
                          isCompact: true,
                        ).animate().fadeIn(delay: 600.ms),
                        
                        const SizedBox(height: 16),
                        
                        _RoleOptionCard(
                          icon: Icons.restaurant,
                          title: 'Soy Restaurante',
                          subtitle: 'Quiero ofrecer ofertas flash de última hora',
                          features: const [
                            'Crea ofertas flash antes del cierre',
                            'Notifica a usuarios cercanos',
                            'Reduce el desperdicio de comida',
                            'Atrae nuevos clientes',
                          ],
                          role: 'restaurant',
                          isSelected: _selectedRole == 'restaurant',
                          onTap: () => setState(() => _selectedRole = 'restaurant'),
                          gradient: LinearGradient(
                            colors: [Colors.red.shade400, Colors.red.shade600],
                          ),
                          isCompact: true,
                        ).animate().fadeIn(delay: 700.ms),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Continue button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: FilledButton(
                    onPressed: _isLoading || _selectedRole == null 
                        ? null 
                        : _continueWithRole,
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Continuar',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward),
                            ],
                          ),
                  ),
                ).animate().fadeIn(delay: 700.ms),
                
                const SizedBox(height: 16),
                
                // Logout option
                TextButton.icon(
                  onPressed: () async {
                    await ref.read(auth0StateProvider.notifier).logout();
                    context.go('/welcome');
                  },
                  icon: const Icon(Icons.logout, size: 18),
                  label: const Text('Usar otra cuenta'),
                ).animate().fadeIn(delay: 800.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleOptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final List<String> features;
  final String role;
  final bool isSelected;
  final VoidCallback onTap;
  final Gradient gradient;
  final bool isCompact;

  const _RoleOptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.features,
    required this.role,
    required this.isSelected,
    required this.onTap,
    required this.gradient,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected 
              ? colorScheme.primary.withOpacity(0.05)
              : colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? colorScheme.primary : Colors.grey.withOpacity(0.2),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: colorScheme.primary.withOpacity(0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Padding(
          padding: EdgeInsets.all(isCompact ? 16 : 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: gradient,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      icon,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          subtitle,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isSelected 
                          ? colorScheme.primary 
                          : Colors.grey.withOpacity(0.2),
                    ),
                    child: isSelected
                        ? const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 18,
                          )
                        : null,
                  ),
                ],
              ),
              
              if (!isCompact) ...[
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                
                // Features
                ...features.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: 18,
                        color: isSelected ? colorScheme.primary : Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          feature,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ),
      ),
    );
  }
}


