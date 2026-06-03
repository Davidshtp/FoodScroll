import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class CustomTextField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? errorText;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final VoidCallback? onSuffixIconPressed; // If needed for password visibility toggle
  final String? hintText;
  final bool readOnly;
  final VoidCallback? onTap;
  final List<TextInputFormatter>? inputFormatters;

  const CustomTextField({
    super.key,
    required this.label,
    required this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.onSuffixIconPressed,
    this.hintText,
    this.readOnly = false,
    this.onTap,
    this.inputFormatters,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Padding(
          padding: const EdgeInsets.only(left: 16.0, bottom: 6.0),
          child: Text(
            label.toUpperCase(),
            style: AppTypography.labelSmall.copyWith(
              color: const Color(0xFFC6A666), // Gold
              letterSpacing: 1.5,
              fontSize: 9,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        
        // Input Field
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          readOnly: readOnly,
          onTap: onTap,
          inputFormatters: inputFormatters,
          style: AppTypography.bodyLarge.copyWith( // Slightly larger text
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
          cursorColor: AppColors.accent,
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
            suffixIcon: suffixIcon == null
                ? null
                : onSuffixIconPressed != null
                    ? IconButton(
                        icon: Icon(suffixIcon, color: const Color(0xFF666666), size: 20),
                        onPressed: onSuffixIconPressed,
                      )
                    : Icon(suffixIcon, color: const Color(0xFF666666), size: 20),
            contentPadding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 22.0),
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
              borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
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
