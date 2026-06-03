import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth/auth_service.dart';
import '../services/customer_service.dart';
import '../services/delivery_service.dart';
import '../services/restaurant_service.dart';
import '../services/storage_service.dart';

class OnboardingNavigation {
  static void confirmCancel(
    BuildContext context, {
    required VoidCallback onConfirm,
  }) {
    showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancelar creación de perfil'),
        content: const Text(
          'Si cancelas, se cerrará tu sesión. ¿Estás seguro?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sí, cancelar'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true) {
        onConfirm();
      }
    });
  }
  static Future<String> resolvePostAuthRoute({
    required AuthUser? user,
    required CustomerService customerService,
    required AuthService authService,
    DeliveryService? deliveryService,
    RestaurantService? restaurantService,
    StorageService? storage,
  }) async {
    final storageService = storage ?? StorageService();
    final clientType = await storageService.getClientType();
    final role = _resolveRole(user, clientType);

    var appStatus = user?.normalizedAppStatus;
    if (appStatus == null || appStatus == 'COMPLETED') {
      try {
        final me = await authService.fetchMe();
        appStatus = me.normalizedAppStatus;
      } catch (_) {
        return '/home';
      }
    }

    if (appStatus == 'COMPLETED' || appStatus == null) {
      return '/home';
    }

    switch (role) {
      case 'delivery':
        return _resolveDeliveryRoute(appStatus);
      case 'restaurant':
        return _resolveRestaurantRoute(appStatus);
      case 'customer':
      default:
        return _resolveCustomerRoute(
          appStatus: appStatus,
          customerService: customerService,
          authService: authService,
        );
    }
  }

  static String resolveRoleKey(AuthUser? user, String? clientType) {
    return _resolveRole(user, clientType);
  }

  static String _resolveRole(AuthUser? user, String? clientType) {
    final role = (user?.role ?? '').toUpperCase();
    if (role.contains('DELIVERY')) return 'delivery';
    if (role.contains('RESTAURANT')) return 'restaurant';
    if (role.contains('CUSTOMER')) return 'customer';

    final client = (user?.client ?? clientType ?? '').toLowerCase();
    if (client == 'delivery' || client == 'restaurant' || client == 'customer') {
      return client;
    }
    return 'customer';
  }

  static String _resolveCustomerRoute({
    required String appStatus,
    required CustomerService customerService,
    required AuthService authService,
  }) {
    switch (appStatus) {
      case 'REQUIRED_BASIC_CONFIG':
        return '/complete-profile';
      case 'REQUIRED_ADDRESS':
        return '/create-address';
      case 'COMPLETED':
        return '/home';
      default:
        return '/home';
    }
  }

  static String _resolveDeliveryRoute(String appStatus) {
    switch (appStatus) {
      case 'REQUIRED_BASIC_CONFIG':
        return '/delivery-profile';
      case 'REQUIRED_VEHICLE':
        return '/add-vehicle';
      case 'REQUIRED_LICENSE':
        return '/add-license';
      case 'COMPLETED':
        return '/home';
      default:
        return '/home';
    }
  }

  static String _resolveRestaurantRoute(String appStatus) {
    switch (appStatus) {
      case 'BASIC_INFO':
      case 'REQUIRED_BASIC_CONFIG':
        return '/restaurant-profile';
      case 'ADDRESS_REQUIRED':
        return '/restaurant-address';
      case 'OPENING_HOURS_REQUIRED':
        return '/opening-hours';
      case 'COMPLETED':
        return '/home';
      default:
        return '/home';
    }
  }
}
