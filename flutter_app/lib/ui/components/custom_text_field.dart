import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class CustomTextField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? errorText;
  final IconData? prefixIcon;
  final VoidCallback? onSuffixIconPressed; // If needed for password visibility toggle
  final String? hintText;

  const CustomTextField({
    super.key,
    required this.label,
    required this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.prefixIcon,
    this.onSuffixIconPressed,
    this.hintText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Padding(
          padding: const EdgeInsets.only(left: 16.0, bottom: 8.0),
          child: Text(
            label.toUpperCase(),
            style: AppTypography.labelSmall.copyWith(
              color: const Color(0xFFC6A666), // Gold
              letterSpacing: 1.5,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        
        // Input Field
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: AppTypography.bodyLarge.copyWith( // Slightly larger text
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
          cursorColor: AppColors.primary, // Red cursor
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF0F0F0F), // Dark background
            hintText: hintText,
            hintStyle: AppTypography.bodyMedium.copyWith(
              color: const Color(0xFF444444),
            ),
            errorText: errorText,
            prefixIcon: prefixIcon != null 
                ? Icon(prefixIcon, color: const Color(0xFF666666), size: 20)
                : null,
            contentPadding: const EdgeInsets.symmetric(vertical: 20.0, horizontal: 24.0), // Generous padding
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: BorderSide.none, // No border by default
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: Color(0xFFDC143C), width: 1.5), // Crimson border on focus
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: AppColors.error, width: 1.0),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
