import 'package:flutter/material.dart';
import '../../theme/app_typography.dart';

class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;

  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    // Gradient button style
    return Container(
      width: double.infinity,
      height: 56, // Slightly taller for modern touch
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFFFF3B30), // Bright Red
            Color(0xFFFF8C69), // Lighter Salmon/Gold-ish transition
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(30), // Pill shape
        boxShadow: [
           BoxShadow(
             color: const Color(0xFFFF3B30).withOpacity(0.4),
             blurRadius: 20,
             offset: const Offset(0, 8),
             spreadRadius: 2,
           ),
        ],
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent, // Transparent to show gradient
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          padding: EdgeInsets.zero,
        ),
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Text(
                label.toUpperCase(),
                style: AppTypography.labelLarge.copyWith(
                  color: Colors.white, 
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  letterSpacing: 1.2,
                ),
              ),
      ),
    );
  }
}
