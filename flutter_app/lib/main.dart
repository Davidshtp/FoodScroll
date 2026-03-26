import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/router.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(
    // ProviderScope initializes Riverpod
    const ProviderScope(
      child: FoodScrollApp(),
    ),
  );
}

class FoodScrollApp extends StatelessWidget {
  const FoodScrollApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'FoodScroll',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme, // Enforce "Gilded Crimson"
      routerConfig: router,
    );
  }
}
