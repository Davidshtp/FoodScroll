import 'package:flutter/material.dart';

class AppColors {
  // Base
  static const Color background = Color(0xFF0F0F0F); // Deep dark background
  static const Color surface = Color(0xFF1E1E1E);    // Slightly lighter for cards/sheets
  static const Color surfaceHighlight = Color(0xFF2C2C2C); // Hover/Active states

  // Primary Identity (Gilded Crimson)
  static const Color primary = Color(0xFFDC143C);    // Crimson Red
  static const Color primaryDark = Color(0xFF8B0000); // Darker shade for gradients/borders
  static const Color accent = Color(0xFFFFD700);     // Gold/Gilded accent

  // Functional
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFE53935);
  static const Color warning = Color(0xFFFFB74D);
  static const Color info = Color(0xFF2196F3);

  // Text
  static const Color textPrimary = Color(0xFFFAFAFA); // Almost white
  static const Color textSecondary = Color(0xFFB0B0B0); // Light Grey
  static const Color textTertiary = Color(0xFF757575);  // Dark Grey
  
  // UI Elements
  static const Color divider = Color(0xFF333333);
  static const Color border = Color(0xFF424242);
  
  // Specific Design Colors
  static const Color inputBackground = Color(0xFF0F0F0F); // Matching the design input bg
  static const Color cardOutline = Color(0xFFDD2C00); // Bright red for outline
  static const Color textInputLabel = Color(0xFFC6A666); // Gold/Tan text
}
