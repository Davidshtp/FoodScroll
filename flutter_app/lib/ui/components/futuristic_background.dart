import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class FuturisticBackground extends StatelessWidget {
  final Widget child;

  const FuturisticBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Base dark background
        Container(
          color: const Color(0xFF0A0A0A), // Deep dark, almost black
        ),

        // Red Glow (Top Left/Center) - subtle ambient light
        Positioned(
          top: -100,
          left: -100,
          right: -100,
          child: Container(
            height: 400,
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.topCenter,
                radius: 1.0,
                colors: [
                  AppColors.primary.withOpacity(0.2),
                  Colors.transparent,
                ],
                stops: const [0.0, 1.0],
              ),
            ),
          ),
        ),
        
        // Grid Pattern
        Positioned.fill(
          child: CustomPaint(
            painter: GridPainter(),
          ),
        ),

        // Child content
        SafeArea(child: child),
      ],
    );
  }
}

class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF222222).withOpacity(0.3)
      ..strokeWidth = 1;

    const double gridSize = 40;

    // Vertical lines
    for (double x = 0; x < size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }

    // Horizontal lines
    for (double y = 0; y < size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
