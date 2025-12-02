import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/responsive.dart';
import 'widgets/job_card.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  
  // Stats that animate
  int _jobCount = 0;
  int _offerCount = 0;
  double _radius = 0;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    
    _animateStats();
  }

  void _animateStats() {
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) setState(() => _radius = 2);
    });
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) setState(() => _jobCount = 6);
    });
    Future.delayed(const Duration(milliseconds: 1100), () {
      if (mounted) setState(() => _offerCount = 2);
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: r.maxContentWidth),
            child: Column(
              children: [
                // Radar Status Card
                Padding(
                  padding: r.responsivePadding(horizontal: 16, vertical: 8),
                  child: _buildRadarStatusCard(primaryOrange, r),
                ),
                
                // Map with Job Card
                Expanded(
                  child: Padding(
                    padding: r.responsivePadding(horizontal: 16, vertical: 0),
                    child: _buildMapSection(r, primaryOrange),
                  ),
                ),
                
                SizedBox(height: r.spacing(mobile: 12)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRadarStatusCard(Color primaryOrange, Responsive r) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: r.spacing(mobile: 14),
        vertical: r.spacing(mobile: 12),
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: primaryOrange.withAlpha(76),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: primaryOrange.withAlpha(20),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Animated radar icon
          SizedBox(
            width: r.iconSize(mobile: 32),
            height: r.iconSize(mobile: 32),
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedBuilder(
                  animation: _pulseController,
                  builder: (context, child) {
                    final size = r.iconSize(mobile: 32);
                    return Container(
                      width: size * (0.5 + _pulseController.value * 0.5),
                      height: size * (0.5 + _pulseController.value * 0.5),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.green.withAlpha(
                          (100 * (1 - _pulseController.value)).toInt(),
                        ),
                      ),
                    );
                  },
                ),
                Container(
                  width: r.iconSize(mobile: 10),
                  height: r.iconSize(mobile: 10),
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: r.spacing(mobile: 12)),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Radar activo',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.bold,
                    fontSize: r.fontSize(mobile: 15, smallPhone: 13),
                    color: Colors.black,
                  ),
                ),
                SizedBox(height: r.spacing(mobile: 2)),
                Text(
                  'Radio: ${_radius.toInt()}km • $_jobCount Trabajos • $_offerCount ofertas',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: r.fontSize(mobile: 12, smallPhone: 10),
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.2, end: 0);
  }

  Widget _buildMapSection(Responsive r, Color primaryOrange) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          children: [
            // Map Background
            _buildMapBackground(),
            
            // Job Card - Animated (responsive position)
            Positioned(
              top: r.spacing(mobile: 70, smallPhone: 50),
              left: r.spacing(mobile: 12, smallPhone: 8),
              child: ResponsiveJobCard(responsive: r)
                  .animate()
                  .fadeIn(delay: 600.ms, duration: 500.ms)
                  .slideX(begin: -0.2, end: 0),
            ),
            
            // Zoom Controls
            Positioned(
              top: r.spacing(mobile: 45, smallPhone: 35),
              right: r.spacing(mobile: 14, smallPhone: 10),
              child: _buildZoomControls(r)
                  .animate()
                  .fadeIn(delay: 400.ms)
                  .slideX(begin: 0.2, end: 0),
            ),
            
            // Map Markers
            _buildMapMarkers(r),
            
            // Legend
            Positioned(
              bottom: r.spacing(mobile: 90, smallPhone: 70),
              left: r.spacing(mobile: 14, smallPhone: 10),
              child: _buildLegend(r)
                  .animate()
                  .fadeIn(delay: 800.ms)
                  .slideY(begin: 0.2, end: 0),
            ),
            
            // Find Offers Button
            Positioned(
              bottom: r.spacing(mobile: 20, smallPhone: 14),
              left: 0,
              right: 0,
              child: Center(
                child: _buildFindOffersButton(primaryOrange, r)
                    .animate()
                    .fadeIn(delay: 1000.ms)
                    .slideY(begin: 0.3, end: 0),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms, duration: 600.ms);
  }

  Widget _buildMapBackground() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFFE9EAED).withAlpha(85),
      ),
      child: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFF5F5F5),
                  Color(0xFFEAEAEA),
                  Color(0xFFF0F0F0),
                ],
              ),
            ),
          ),
          CustomPaint(
            size: Size.infinite,
            painter: MapGridPainter(),
          ),
          Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(-0.3, -0.3),
                radius: 1.5,
                colors: [
                  Colors.white.withAlpha(128),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildZoomControls(Responsive r) {
    final size = r.iconSize(mobile: 40, smallPhone: 34);
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(25),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildZoomButton(Icons.add, () {}, size, r),
          Container(
            height: 1,
            width: size * 0.7,
            color: Colors.grey[200],
          ),
          _buildZoomButton(Icons.remove, () {}, size, r),
        ],
      ),
    );
  }

  Widget _buildZoomButton(IconData icon, VoidCallback onTap, double size, Responsive r) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          color: Colors.black87,
          size: r.iconSize(mobile: 22, smallPhone: 18),
        ),
      ),
    );
  }

  Widget _buildMapMarkers(Responsive r) {
    // Responsive marker positions
    final markers = [
      _MarkerData(
        leftPercent: 0.2,
        topPercent: 0.6,
        color: Colors.blue,
        isUser: true,
      ),
      _MarkerData(leftPercent: 0.38, topPercent: 0.5, color: Colors.green),
      _MarkerData(leftPercent: 0.7, topPercent: 0.6, color: Colors.green),
      _MarkerData(leftPercent: 0.5, topPercent: 0.72, color: Colors.red),
      _MarkerData(leftPercent: 0.8, topPercent: 0.42, color: Colors.red),
      _MarkerData(
        leftPercent: 0.3,
        topPercent: 0.42,
        color: const Color(0xFFFF6B36),
        isParkiing: true,
      ),
    ];

    return Stack(
      children: markers.asMap().entries.map((entry) {
        final index = entry.key;
        final marker = entry.value;
        return _buildMarker(
          leftPercent: marker.leftPercent,
          topPercent: marker.topPercent,
          color: marker.color,
          isUser: marker.isUser,
          isParkiing: marker.isParkiing,
          r: r,
          delay: 400 + index * 80,
        );
      }).toList(),
    );
  }

  Widget _buildMarker({
    required double leftPercent,
    required double topPercent,
    required Color color,
    required Responsive r,
    bool isUser = false,
    bool isParkiing = false,
    int delay = 400,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final left = constraints.maxWidth * leftPercent;
        final top = constraints.maxHeight * topPercent;
        
        return Positioned(
          left: left,
          top: top,
          child: AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              final pulse = isUser ? 0.1 * _pulseController.value : 0.0;
              return Transform.scale(
                scale: 1.0 + pulse,
                child: child,
              );
            },
            child: isParkiing
                ? Container(
                    width: r.iconSize(mobile: 28, smallPhone: 24),
                    height: r.iconSize(mobile: 28, smallPhone: 24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF8A5C), Color(0xFFFF6B36)],
                      ),
                      borderRadius: BorderRadius.circular(6),
                      boxShadow: [
                        BoxShadow(
                          color: color.withAlpha(76),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        'P',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: r.fontSize(mobile: 14, smallPhone: 12),
                          color: Colors.white,
                        ),
                      ),
                    ),
                  )
                : Container(
                    width: r.iconSize(mobile: isUser ? 14 : 12, smallPhone: isUser ? 12 : 10),
                    height: r.iconSize(mobile: isUser ? 14 : 12, smallPhone: isUser ? 12 : 10),
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: color.withAlpha(76),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
          ),
        ).animate().fadeIn(delay: Duration(milliseconds: delay));
      },
    );
  }

  Widget _buildLegend(Responsive r) {
    return Container(
      padding: EdgeInsets.all(r.spacing(mobile: 10, smallPhone: 8)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.black12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(13),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildLegendItem(Colors.blue, 'Tu ubicación', r),
          SizedBox(height: r.spacing(mobile: 5, smallPhone: 4)),
          _buildLegendItem(Colors.green, 'Trabajo cercano', r),
          SizedBox(height: r.spacing(mobile: 5, smallPhone: 4)),
          _buildLegendItem(Colors.red, 'Trabajo urgente', r),
          SizedBox(height: r.spacing(mobile: 5, smallPhone: 4)),
          _buildLegendItem(const Color(0xFFFF6B36), 'Oferta comercial', r),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label, Responsive r) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: r.iconSize(mobile: 8, smallPhone: 6),
          height: r.iconSize(mobile: 8, smallPhone: 6),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        SizedBox(width: r.spacing(mobile: 8, smallPhone: 6)),
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: r.fontSize(mobile: 11, smallPhone: 9),
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildFindOffersButton(Color primaryOrange, Responsive r) {
    return GestureDetector(
      onTap: () => context.go('/login'),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: r.spacing(mobile: 36, smallPhone: 28),
          vertical: r.spacing(mobile: 12, smallPhone: 10),
        ),
        decoration: BoxDecoration(
          color: primaryOrange,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: primaryOrange.withAlpha(102),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Text(
          'Encontrar ofertas',
          style: TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.bold,
            fontSize: r.fontSize(mobile: 15, smallPhone: 13),
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

/// Marker data helper
class _MarkerData {
  final double leftPercent;
  final double topPercent;
  final Color color;
  final bool isUser;
  final bool isParkiing;

  _MarkerData({
    required this.leftPercent,
    required this.topPercent,
    required this.color,
    this.isUser = false,
    this.isParkiing = false,
  });
}

/// Responsive Job Card wrapper
class ResponsiveJobCard extends StatelessWidget {
  final Responsive responsive;

  const ResponsiveJobCard({super.key, required this.responsive});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: responsive.jobCardWidth,
      child: const JobCard(),
    );
  }
}

/// Custom painter for map grid lines
class MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey.withAlpha(38)
      ..strokeWidth = 1;

    for (var i = 0; i < size.height; i += 60) {
      canvas.drawLine(
        Offset(0, i.toDouble()),
        Offset(size.width, i.toDouble()),
        paint,
      );
    }

    for (var i = 0; i < size.width; i += 60) {
      canvas.drawLine(
        Offset(i.toDouble(), 0),
        Offset(i.toDouble(), size.height),
        paint,
      );
    }

    final diagonalPaint = Paint()
      ..color = Colors.grey.withAlpha(51)
      ..strokeWidth = 2;

    canvas.drawLine(
      Offset(0, size.height * 0.3),
      Offset(size.width, size.height * 0.7),
      diagonalPaint,
    );
    
    canvas.drawLine(
      Offset(size.width * 0.2, 0),
      Offset(size.width * 0.8, size.height),
      diagonalPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
