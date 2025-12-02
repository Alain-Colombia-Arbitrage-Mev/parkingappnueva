import 'package:flutter/material.dart';
import 'dart:math' as math;

class RadarAnimation extends StatefulWidget {
  final double size;
  final Color color;
  
  const RadarAnimation({
    super.key,
    this.size = 200,
    this.color = const Color(0xFFFF6B36),
  });

  @override
  State<RadarAnimation> createState() => _RadarAnimationState();
}

class _RadarAnimationState extends State<RadarAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            painter: RadarPainter(
              animation: _controller.value,
              color: widget.color,
            ),
          );
        },
      ),
    );
  }
}

class RadarPainter extends CustomPainter {
  final double animation;
  final Color color;

  RadarPainter({
    required this.animation,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width / 2;

    // Draw 3 expanding circles with fade out effect
    for (int i = 0; i < 3; i++) {
      final delay = i * 0.33;
      final circleAnimation = (animation + delay) % 1.0;
      
      final radius = maxRadius * circleAnimation;
      final opacity = 1.0 - circleAnimation;

      final paint = Paint()
        ..color = color.withOpacity(opacity * 0.3)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      canvas.drawCircle(center, radius, paint);
    }

    // Draw rotating radar sweep
    final sweepAngle = animation * 2 * math.pi;
    final sweepPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          color.withOpacity(0.4),
          color.withOpacity(0.0),
        ],
        stops: const [0.0, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: maxRadius));

    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(sweepAngle);
    
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(maxRadius, 0)
      ..arcTo(
        Rect.fromCircle(center: Offset.zero, radius: maxRadius),
        0,
        math.pi / 3, // 60 degree sweep
        false,
      )
      ..close();

    canvas.drawPath(path, sweepPaint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(RadarPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}
