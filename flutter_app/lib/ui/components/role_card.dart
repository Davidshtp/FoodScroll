import 'package:flutter/material.dart';
import '../../theme/app_typography.dart';

class RoleCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;
  final bool isSelected;

  const RoleCard({
    super.key,
    required this.title,
    required this.icon,
    required this.onTap,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    // Exact colors from design reference
    final Color activeRed = const Color(0xFFFF3B30); // Bright pure red
    final Color inactiveBorder = const Color(0xFFFF3B30).withOpacity(0.5); // Dimmed red
    final Color cardBg = const Color(0xFF0F0F0F); // Dark background
    const double borderRadius = 24.0;

    if (isSelected) {
      // FILLED RED STYLE
      return GestureDetector(
        onTap: onTap,
        child: Container(
          // Fixed height for consistency
          height: 100, 
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0), // Vertical handled by alignment
          decoration: BoxDecoration(
            color: activeRed,
            borderRadius: BorderRadius.circular(borderRadius),
            boxShadow: [
              BoxShadow(
                color: activeRed.withOpacity(0.4),
                blurRadius: 20,
                offset: const Offset(0, 8),
                spreadRadius: 2,
              ),
            ],
          ),
          child: Row(
            children: [
              // Icon Box inside Card
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A1A), // Dark inner box
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFC6A666), width: 1), // Gold border
                ),
                child: Icon(icon, color: const Color(0xFFC6A666), size: 28),
              ),
              const SizedBox(width: 20),
              // Text Content
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.titleLarge.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    height: 1.1, // Tighter line height
                    fontSize: 20,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      // OUTLINED DARK STYLE
      return GestureDetector(
        onTap: onTap,
        child: Container(
          height: 100,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
          decoration: BoxDecoration(
            color: Colors.transparent, // Or very dark if needed
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(color: inactiveBorder, width: 1.5),
          ),
          child: Row(
            children: [
              // Icon Box inside Card
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFF141414), // Slightly lighter than pure bg
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFC6A666), width: 1),
                ),
                child: Icon(icon, color: const Color(0xFFC6A666), size: 28),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.titleLarge.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    height: 1.1,
                    fontSize: 20,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }
}
