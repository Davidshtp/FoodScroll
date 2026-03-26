import 'package:go_router/go_router.dart';
import '../ui/pages/auth/role_selection_page.dart';
import '../ui/pages/auth/login_page.dart';
import '../ui/pages/auth/register_page.dart';
import '../ui/pages/home_page.dart';
import '../services/storage_service.dart';

final router = GoRouter(
  initialLocation: '/', // Start at role selection, or redirect to login.
  redirect: (context, state) async {
    final storage = StorageService();
    // Check if client type is selected
    final clientType = await storage.getClientType();
    
    final isOnSelectionPage = state.matchedLocation == '/';

    if (clientType == null) {
      // If no client type, must be on selection page
      return isOnSelectionPage ? null : '/';
    } else {
      // If client type exists, redirect selection page to login
      if (isOnSelectionPage) {
        return '/login'; // Or check if authenticated
      }
    }
    return null; 
  },
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const RoleSelectionPage(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterPage(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomePage(),
    ),
  ],
);
