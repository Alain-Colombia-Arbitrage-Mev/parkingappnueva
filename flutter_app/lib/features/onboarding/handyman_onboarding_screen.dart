import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/convex_service.dart';

class HandymanOnboardingScreen extends ConsumerStatefulWidget {
  const HandymanOnboardingScreen({super.key});

  @override
  ConsumerState<HandymanOnboardingScreen> createState() => _HandymanOnboardingScreenState();
}

class _HandymanOnboardingScreenState extends ConsumerState<HandymanOnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;
  String? _errorMessage;

  // Form data
  final List<String> _selectedCategories = [];
  final List<String> _selectedSkills = [];
  double _hourlyRate = 50;
  final _bioController = TextEditingController();
  final _phoneController = TextEditingController();

  // Available categories
  final List<Map<String, String>> _categories = [
    {'id': 'plumbing', 'name': 'Plomería', 'icon': '🔧'},
    {'id': 'electrical', 'name': 'Electricidad', 'icon': '⚡'},
    {'id': 'carpentry', 'name': 'Carpintería', 'icon': '🪚'},
    {'id': 'painting', 'name': 'Pintura', 'icon': '🎨'},
    {'id': 'cleaning', 'name': 'Limpieza', 'icon': '🧹'},
    {'id': 'gardening', 'name': 'Jardinería', 'icon': '🌱'},
    {'id': 'moving', 'name': 'Mudanzas', 'icon': '📦'},
    {'id': 'appliances', 'name': 'Electrodomésticos', 'icon': '🔌'},
    {'id': 'locksmith', 'name': 'Cerrajería', 'icon': '🔐'},
    {'id': 'hvac', 'name': 'Aire Acondicionado', 'icon': '❄️'},
    {'id': 'roofing', 'name': 'Techos', 'icon': '🏠'},
    {'id': 'flooring', 'name': 'Pisos', 'icon': '🪵'},
    {'id': 'assembly', 'name': 'Armado de Muebles', 'icon': '🪑'},
    {'id': 'general', 'name': 'Mantenimiento General', 'icon': '🛠️'},
  ];

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _submitProfile();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      context.go('/onboarding/role');
    }
  }

  Future<void> _submitProfile() async {
    if (_selectedCategories.isEmpty) {
      setState(() {
        _errorMessage = 'Selecciona al menos una categoría de servicio';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final convexService = ref.read(convexServiceProvider);
      
      if (convexService != null) {
        await convexService.createUserWithRole(
          role: 'handyman',
          categories: _selectedCategories,
          skills: _selectedSkills,
          hourlyRate: _hourlyRate,
          bio: _bioController.text.isNotEmpty ? _bioController.text : null,
          phone: _phoneController.text.isNotEmpty ? _phoneController.text : null,
        );
      }

      if (mounted) {
        context.go('/');
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
  void dispose() {
    _pageController.dispose();
    _bioController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.orange.shade50,
              colorScheme.surface,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios),
                      onPressed: _previousPage,
                    ),
                    Expanded(
                      child: Column(
                        children: [
                          Text(
                            'Perfil Profesional',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Paso ${_currentPage + 1} de 3',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 48), // Balance the back button
                  ],
                ),
              ),
              
              // Progress indicator
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  children: List.generate(3, (index) {
                    return Expanded(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 4,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(2),
                          color: index <= _currentPage
                              ? Colors.orange
                              : Colors.grey.withOpacity(0.3),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Error message
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Container(
                    padding: const EdgeInsets.all(12),
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
                ),
              
              // Pages
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (page) {
                    setState(() {
                      _currentPage = page;
                      _errorMessage = null;
                    });
                  },
                  children: [
                    _buildCategoriesPage(),
                    _buildRatePage(),
                    _buildProfilePage(),
                  ],
                ),
              ),
              
              // Bottom buttons
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    if (_currentPage > 0)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _previousPage,
                          child: const Text('Atrás'),
                        ),
                      ),
                    if (_currentPage > 0) const SizedBox(width: 16),
                    Expanded(
                      flex: 2,
                      child: FilledButton(
                        onPressed: _isLoading ? null : _nextPage,
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.orange,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                _currentPage == 2 ? 'Finalizar' : 'Continuar',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoriesPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '¿Qué servicios ofreces?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 8),
          Text(
            'Selecciona las categorías en las que trabajas. Podrás agregar más después.',
            style: TextStyle(color: Colors.grey[600]),
          ).animate().fadeIn(delay: 100.ms),
          const SizedBox(height: 24),
          
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _categories.asMap().entries.map((entry) {
              final index = entry.key;
              final category = entry.value;
              final isSelected = _selectedCategories.contains(category['id']);
              
              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      _selectedCategories.remove(category['id']);
                    } else {
                      _selectedCategories.add(category['id']!);
                    }
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected 
                        ? Colors.orange.withOpacity(0.15)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? Colors.orange : Colors.grey.withOpacity(0.2),
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        category['icon']!,
                        style: const TextStyle(fontSize: 20),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        category['name']!,
                        style: TextStyle(
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? Colors.orange.shade700 : Colors.black87,
                        ),
                      ),
                      if (isSelected) ...[
                        const SizedBox(width: 8),
                        Icon(
                          Icons.check_circle,
                          size: 18,
                          color: Colors.orange.shade700,
                        ),
                      ],
                    ],
                  ),
                ),
              ).animate().fadeIn(delay: Duration(milliseconds: 50 * index));
            }).toList(),
          ),
          
          const SizedBox(height: 24),
          
          if (_selectedCategories.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green),
                  const SizedBox(width: 8),
                  Text(
                    '${_selectedCategories.length} ${_selectedCategories.length == 1 ? 'categoría seleccionada' : 'categorías seleccionadas'}',
                    style: const TextStyle(color: Colors.green),
                  ),
                ],
              ),
            ).animate().fadeIn(),
        ],
      ),
    );
  }

  Widget _buildRatePage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '¿Cuánto cobras por hora?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 8),
          Text(
            'Establece tu tarifa base por hora. Podrás ajustarla para cada trabajo.',
            style: TextStyle(color: Colors.grey[600]),
          ).animate().fadeIn(delay: 100.ms),
          const SizedBox(height: 48),
          
          // Rate display
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.orange.shade400, Colors.orange.shade600],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.orange.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        '\$${_hourlyRate.toInt()}',
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const Text(
                        'por hora',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms).scale(),
                
                const SizedBox(height: 48),
                
                // Slider
                Slider(
                  value: _hourlyRate,
                  min: 10,
                  max: 200,
                  divisions: 19,
                  activeColor: Colors.orange,
                  label: '\$${_hourlyRate.toInt()}/hr',
                  onChanged: (value) {
                    setState(() {
                      _hourlyRate = value;
                    });
                  },
                ),
                
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('\$10', style: TextStyle(color: Colors.grey[600])),
                      Text('\$200', style: TextStyle(color: Colors.grey[600])),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 48),
          
          // Rate tips
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.lightbulb_outline, color: Colors.blue.shade700),
                    const SizedBox(width: 8),
                    Text(
                      'Consejos',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '• Investiga las tarifas del mercado en tu zona\n'
                  '• Considera tu experiencia y certificaciones\n'
                  '• Puedes ajustar según la complejidad del trabajo',
                  style: TextStyle(
                    color: Colors.blue.shade900,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 300.ms),
        ],
      ),
    );
  }

  Widget _buildProfilePage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Completa tu perfil',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 8),
          Text(
            'Esta información ayudará a los clientes a conocerte mejor.',
            style: TextStyle(color: Colors.grey[600]),
          ).animate().fadeIn(delay: 100.ms),
          const SizedBox(height: 32),
          
          // Phone
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'Teléfono (opcional)',
              prefixIcon: const Icon(Icons.phone),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              filled: true,
              fillColor: Colors.white,
            ),
          ).animate().fadeIn(delay: 200.ms),
          
          const SizedBox(height: 20),
          
          // Bio
          TextField(
            controller: _bioController,
            maxLines: 4,
            maxLength: 500,
            decoration: InputDecoration(
              labelText: 'Acerca de ti (opcional)',
              hintText: 'Describe tu experiencia, especialidades y por qué los clientes deberían contratarte...',
              alignLabelWithHint: true,
              prefixIcon: const Padding(
                padding: EdgeInsets.only(bottom: 60),
                child: Icon(Icons.person),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              filled: true,
              fillColor: Colors.white,
            ),
          ).animate().fadeIn(delay: 300.ms),
          
          const SizedBox(height: 32),
          
          // Summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.orange.withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.orange.shade700),
                    const SizedBox(width: 8),
                    Text(
                      'Resumen de tu perfil',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.orange.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildSummaryRow(
                  'Servicios',
                  _selectedCategories.length.toString(),
                ),
                _buildSummaryRow(
                  'Tarifa',
                  '\$${_hourlyRate.toInt()}/hora',
                ),
                if (_phoneController.text.isNotEmpty)
                  _buildSummaryRow('Teléfono', _phoneController.text),
              ],
            ),
          ).animate().fadeIn(delay: 400.ms),
          
          const SizedBox(height: 24),
          
          // Next steps info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '📋 Próximos pasos después de registrarte:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                _buildNextStep(1, 'Verificar tu identidad'),
                _buildNextStep(2, 'Subir certificaciones (opcional)'),
                _buildNextStep(3, 'Empezar a recibir propuestas'),
              ],
            ),
          ).animate().fadeIn(delay: 500.ms),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[700])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildNextStep(int number, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$number',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(text),
        ],
      ),
    );
  }
}


