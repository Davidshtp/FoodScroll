import 'package:go_router/go_router.dart';
import '../core/onboarding_navigation.dart';
import '../models/user_model.dart';
import '../services/storage_service.dart';
import '../ui/pages/auth/role_selection_page.dart';
import '../ui/pages/auth/login_page.dart';
import '../ui/pages/auth/register_page.dart';
import '../ui/pages/auth/delivery_profile_page.dart';
import '../ui/pages/auth/add_vehicle_page.dart';
import '../ui/pages/auth/add_license_page.dart';
import '../ui/pages/auth/restaurant_profile_page.dart';
import '../ui/pages/auth/restaurant_address_page.dart';
import '../ui/pages/auth/opening_hours_page.dart';
import '../ui/pages/complete_profile_page.dart';
import '../ui/pages/add_address_view.dart';
import '../ui/pages/home_page.dart';

final router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final storage = StorageService();
    final clientType = await storage.getClientType();
    final accessToken = await storage.getAccessToken();
    final userData = await storage.getUser();

    final currentPath = state.matchedLocation;
    final isOnSelectionPage = currentPath == '/';
    final isAuthRoute = currentPath == '/login' || currentPath == '/register';
    final hasValidLocalSession =
        accessToken != null && accessToken.isNotEmpty && userData != null;

    if (clientType == null) {
      return isOnSelectionPage ? null : '/';
    }

    if (!hasValidLocalSession) {
      await storage.clearSession();
      if (isOnSelectionPage) return '/login';
      return isAuthRoute ? null : '/login';
    }

    final user = AuthUser.fromJson(userData);
    final appStatus = user.normalizedAppStatus;
    final role = OnboardingNavigation.resolveRoleKey(user, clientType);

    final onboardingRoutes = [
      '/complete-profile', '/create-address',
      '/delivery-profile', '/add-vehicle', '/add-license',
      '/restaurant-profile', '/restaurant-address', '/opening-hours',
    ];
    final isOnboardingRoute = onboardingRoutes.contains(currentPath);

    if (isAuthRoute || isOnSelectionPage) {
      if (appStatus == null || appStatus == 'COMPLETED') return '/home';
      final target = _resolveRouteForStatus(role, appStatus);
      return target ?? '/home';
    }

    if (isOnboardingRoute && (appStatus == null || appStatus == 'COMPLETED')) {
      return '/home';
    }

    if (appStatus != null && appStatus != 'COMPLETED') {
      final target = _resolveRouteForStatus(role, appStatus);
      if (target != null && currentPath != target) {
        return target;
      }
    }

    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (context, state) => const RoleSelectionPage()),
    GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
    GoRoute(path: '/register', builder: (context, state) => const RegisterPage()),
    GoRoute(path: '/home', builder: (context, state) => const HomePage()),
    GoRoute(path: '/complete-profile', builder: (context, state) => const CompleteProfilePage()),
    GoRoute(path: '/create-address', builder: (context, state) => const AddAddressView()),
    GoRoute(path: '/delivery-profile', builder: (context, state) => const DeliveryProfilePage()),
    GoRoute(path: '/add-vehicle', builder: (context, state) => const AddVehiclePage()),
    GoRoute(path: '/add-license', builder: (context, state) => const AddLicensePage()),
    GoRoute(path: '/restaurant-profile', builder: (context, state) => const RestaurantProfilePage()),
    GoRoute(path: '/restaurant-address', builder: (context, state) => const RestaurantAddressPage()),
    GoRoute(path: '/opening-hours', builder: (context, state) => const OpeningHoursPage()),
  ],
);

String? _resolveRouteForStatus(String role, String appStatus) {
  switch (role) {
    case 'delivery':
      switch (appStatus) {
        case 'REQUIRED_BASIC_CONFIG': return '/delivery-profile';
        case 'REQUIRED_VEHICLE': return '/add-vehicle';
        case 'REQUIRED_LICENSE': return '/add-license';
      }
    case 'restaurant':
      switch (appStatus) {
        case 'BASIC_INFO':
        case 'REQUIRED_BASIC_CONFIG':
          return '/restaurant-profile';
        case 'ADDRESS_REQUIRED': return '/restaurant-address';
        case 'OPENING_HOURS_REQUIRED': return '/opening-hours';
      }
    case 'customer':
      switch (appStatus) {
        case 'REQUIRED_BASIC_CONFIG': return '/complete-profile';
        case 'REQUIRED_ADDRESS': return '/create-address';
      }
  }
  return null;
}
