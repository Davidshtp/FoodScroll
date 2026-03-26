import 'package:flutter/material.dart';

class AppShadows {
  static const List<BoxShadow> card = [
    BoxShadow(
      color: Color(0x40000000), // 25% opacity black
      offset: Offset(0, 4),
      blurRadius: 8,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> floating = [
    BoxShadow(
      color: Color(0x40000000), // 25% opacity black
      offset: Offset(0, 8),
      blurRadius: 16,
      spreadRadius: 2,
    ),
  ];
  
  static const List<BoxShadow> glow = [
    BoxShadow(
      color: Color(0x33DC143C), // Crimson glow
      offset: Offset(0, 0),
      blurRadius: 12,
      spreadRadius: 2,
    ),
  ];
}
