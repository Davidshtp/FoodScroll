# FoodScroll Architecture

This project follows a modular, layer-based architecture designed for scalability and maintainability.

## Folder Structure

- **config/**: Global configuration, routes (`router.dart`), and environment constants.
- **theme/**: Centralized visual identity ("Gilded Crimson").
  - `app_colors.dart`: All color definitions.
  - `app_typography.dart`: Text styles.
  - `app_spacing.dart`: Margins and paddings.
  - `app_theme.dart`: The `ThemeData` assembly.
- **models/**: Data classes (serialize/deserialize JSON).
- **services/**: External data sources (API clients, Local Storage).
  - Use `ApiService` for raw HTTP calls.
  - Extend for specific domains like `AuthService`.
- **repositories/**: Abstraction layer between Services and logic. (Optional but recommended for complex data logic).
- **state/**: State management using Riverpod.
  - `providers.dart`: Global dependency injection.
  - Feature-specific providers can live here or near features.
- **ui/**: usage of Flutter Widgets.
  - **components/**: Small, reusable widgets (Buttons, Inputs, Cards). No business logic.
  - **layouts/**: Structural widgets that compose components (FeedLayout, ScaffoldLayout).
  - **pages/**: Full screens (Home, Profile, Login). These connect to Providers.
- **utils/**: Helper functions and extensions.

## Key Principles

1.  **Strict Theming**: Never hardcode colors or text styles in widgets. Use `AppTheme` or `AppColors`.
2.  **Separation of Concerns**: UI components should not make API calls directly. Use Providers/Controllers.
3.  **State Management**: Use `ConsumerWidget` (Riverpod) for reactive UI updates.
