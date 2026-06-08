import 'package:go_router/go_router.dart';
import '../core/onboarding_navigation.dart';
import '../models/user_model.dart';
import '../services/storage_service.dart';
import '../models/publication_model.dart';
import '../models/order_model.dart';
import '../ui/pages/auth/role_selection_page.dart';
import '../ui/pages/auth/login_page.dart';
import '../ui/pages/auth/register_page.dart';
import '../ui/pages/auth/forgot_password_page.dart';
import '../ui/pages/auth/reset_password_page.dart';
import '../ui/pages/auth/delivery_profile_page.dart' as onboarding;
import '../ui/pages/auth/add_vehicle_page.dart';
import '../ui/pages/auth/add_license_page.dart';
import '../ui/pages/auth/restaurant_profile_page.dart' as onboarding_rest;
import '../ui/pages/auth/restaurant_address_page.dart';
import '../ui/pages/auth/opening_hours_page.dart';
import '../ui/pages/complete_profile_page.dart';
import '../ui/pages/add_address_view.dart';
import '../ui/pages/home_page.dart';
import '../ui/pages/profile/customer_profile_page.dart';
import '../ui/pages/profile/delivery_profile_page.dart';
import '../ui/pages/profile/restaurant_profile_page.dart';
import '../ui/pages/profile/verify_email_page.dart';
import '../ui/pages/profile/verify_email_code_page.dart';
import '../ui/pages/restaurant/publications_list_page.dart';
import '../ui/pages/restaurant/create_publication_page.dart';
import '../ui/pages/restaurant/orders_list_page.dart';
import '../ui/pages/restaurant/order_detail_page.dart';
import '../ui/pages/customer/cart_page.dart';
import '../ui/pages/customer/customer_orders_page.dart';
import '../ui/pages/customer/customer_order_detail_page.dart';
import '../ui/pages/customer/restaurant_public_profile_page.dart';
import '../ui/pages/delivery/delivery_home_page.dart';
import '../ui/pages/delivery/delivery_order_detail_page.dart';
import '../models/delivery_order_model.dart';


final router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final storage = StorageService();
    final clientType = await storage.getClientType();
    final accessToken = await storage.getAccessToken();
    final userData = await storage.getUser();

    final currentPath = state.matchedLocation;
    final isOnSelectionPage = currentPath == '/';
    final isAuthRoute = currentPath == '/login' || currentPath == '/register' || currentPath == '/forgot-password' || currentPath == '/reset-password';
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
      '/delivery-profile',
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
    GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordPage()),
    GoRoute(path: '/reset-password', builder: (context, state) {
      final email = state.extra as String? ?? '';
      return ResetPasswordPage(email: email);
    }),
    GoRoute(path: '/home', builder: (context, state) => const HomePage()),
    GoRoute(path: '/complete-profile', builder: (context, state) => const CompleteProfilePage()),
    GoRoute(path: '/create-address', builder: (context, state) => const AddAddressView()),
    GoRoute(path: '/profile-add-address', builder: (context, state) => const AddAddressView(isFromProfile: true)),
    GoRoute(path: '/delivery-profile', builder: (context, state) => const onboarding.DeliveryProfilePage()),
    GoRoute(path: '/add-vehicle', builder: (context, state) => const AddVehiclePage()),
    GoRoute(path: '/add-license', builder: (context, state) => const AddLicensePage()),
    GoRoute(path: '/restaurant-profile', builder: (context, state) => const onboarding_rest.RestaurantProfilePage()),
    GoRoute(path: '/restaurant-address', builder: (context, state) => RestaurantAddressPage(isFromSettings: state.extra == true)),
    GoRoute(path: '/opening-hours', builder: (context, state) => OpeningHoursPage(isFromSettings: state.extra == true)),
    GoRoute(
      path: '/verify-email',
      builder: (context, state) => const VerifyEmailPage(),
    ),
    GoRoute(
      path: '/verify-email-code',
      builder: (context, state) {
        final email = state.extra as String? ?? '';
        return VerifyEmailCodePage(email: email);
      },
    ),
    GoRoute(
      path: '/restaurant/publications',
      builder: (context, state) => const PublicationsListPage(),
    ),
    GoRoute(
      path: '/restaurant/publications/create',
      builder: (context, state) => const CreatePublicationPage(),
    ),
    GoRoute(
      path: '/restaurant/publications/edit',
      builder: (context, state) {
        final pub = state.extra as RestaurantPublication?;
        return CreatePublicationPage(publication: pub);
      },
    ),
    GoRoute(
      path: '/restaurant/orders',
      builder: (context, state) => const OrdersListPage(),
    ),
    GoRoute(
      path: '/restaurant/orders/:id',
      builder: (context, state) {
        final enriched = state.extra as EnrichedOrder?;
        if (enriched != null) return OrderDetailPage(enrichedOrder: enriched);
        return const OrdersListPage();
      },
    ),
    GoRoute(
      path: '/profile/customer',
      builder: (context, state) => const CustomerProfilePage(),
    ),
    GoRoute(
      path: '/profile/delivery',
      builder: (context, state) => const DeliveryProfilePage(),
    ),
    GoRoute(
      path: '/profile/restaurant',
      builder: (context, state) => const RestaurantProfilePage(),
    ),
    GoRoute(
      path: '/cart',
      builder: (context, state) => const CartPage(),
    ),
    GoRoute(
      path: '/customer/orders/:id',
      builder: (context, state) {
        final enriched = state.extra as EnrichedOrder?;
        if (enriched != null) return CustomerOrderDetailPage(enrichedOrder: enriched);
        return const CustomerOrdersPage();
      },
    ),
    GoRoute(
      path: '/restaurant-public-profile/:id',
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return RestaurantPublicProfilePage(restaurantId: id);
      },
    ),
    GoRoute(
      path: '/delivery/orders',
      builder: (context, state) => const DeliveryHomePage(),
    ),
    GoRoute(
      path: '/delivery/orders/:id',
      builder: (context, state) {
        final delivery = state.extra as DeliveryOrder?;
        if (delivery != null) return DeliveryOrderDetailPage(deliveryOrder: delivery);
        return const DeliveryHomePage();
      },
    ),
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
