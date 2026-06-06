import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/order_model.dart';
import 'api_service.dart';

final orderServiceProvider = Provider<OrderService>((ref) {
  return OrderService();
});

class OrderException implements Exception {
  final int? statusCode;
  final String message;

  OrderException({this.statusCode, String? message})
      : message = message ?? 'Ocurrió un error, intenta nuevamente';

  factory OrderException.fromApi(ApiException e) {
    return OrderException(
      statusCode: e.statusCode,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class OrderService {
  final ApiService _apiService = ApiService();

  Future<OrdersResponse> fetchOrders() async {
    try {
      final response = await _apiService.get('/orders/restaurant/');
      final data = response.data as Map<String, dynamic>? ?? {};
      return OrdersResponse.fromJson(data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<OrdersResponse> fetchOrderHistory({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/orders/restaurant/history',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return OrdersResponse.fromJson(data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<RestaurantOrder> confirmOrder(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/confirm');
      final data = response.data as Map<String, dynamic>? ?? {};
      return RestaurantOrder.fromJson(data['order'] as Map<String, dynamic>? ?? data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<void> rejectOrder(String orderId) async {
    try {
      await _apiService.post('/orders/$orderId/reject');
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<RestaurantOrder> startPreparing(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/preparing');
      final data = response.data as Map<String, dynamic>? ?? {};
      return RestaurantOrder.fromJson(data['order'] as Map<String, dynamic>? ?? data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<RestaurantOrder> markReady(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/ready');
      final data = response.data as Map<String, dynamic>? ?? {};
      return RestaurantOrder.fromJson(data['order'] as Map<String, dynamic>? ?? data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }
}
