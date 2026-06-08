import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/order_model.dart';
import '../models/delivery_order_model.dart';
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

  Future<EnrichedOrder> confirmOrder(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/confirm');
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return EnrichedOrder.fromJson(orderData);
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

  Future<EnrichedOrder> startPreparing(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/preparing');
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return EnrichedOrder.fromJson(orderData);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<EnrichedOrder> markReady(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/ready');
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return EnrichedOrder.fromJson(orderData);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<OrdersResponse> fetchMyOrders() async {
    try {
      final response = await _apiService.get('/orders');
      final data = response.data as Map<String, dynamic>? ?? {};
      return OrdersResponse.fromJson(data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<RestaurantOrder> createOrder({
    required String customerAddressId,
    required List<Map<String, dynamic>> orderItems,
  }) async {
    try {
      final response = await _apiService.post(
        '/orders',
        data: {
          'customerAddressId': customerAddressId,
          'orderItems': orderItems,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return RestaurantOrder.fromJson(orderData);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<void> cancelOrder(String orderId) async {
    try {
      await _apiService.post('/orders/$orderId/cancel');
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<EnrichedOrder> fetchOrderById(String orderId) async {
    try {
      final response = await _apiService.get('/orders/$orderId');
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return EnrichedOrder.fromJson(orderData);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<DeliveryOrdersResponse> fetchAvailableOrders() async {
    try {
      final response = await _apiService.get('/orders/available');
      final data = response.data as Map<String, dynamic>? ?? {};
      return DeliveryOrdersResponse.fromJson(data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<DeliveryOrder> acceptOrder(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/accept');
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return DeliveryOrder.fromJson({'order': orderData});
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<DeliveryOrdersResponse> fetchMyDeliveries() async {
    try {
      final response = await _apiService.get('/orders/my-deliveries');
      final data = response.data as Map<String, dynamic>? ?? {};
      return DeliveryOrdersResponse.fromJson(data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<DeliveryOrder> pickupOrder(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/pickup');
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return DeliveryOrder.fromJson({'order': orderData});
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<DeliveryOrder> deliverOrder(String orderId) async {
    try {
      final response = await _apiService.post('/orders/$orderId/deliver');
      final data = response.data as Map<String, dynamic>? ?? {};
      final orderData = data['order'] as Map<String, dynamic>? ?? data;
      return DeliveryOrder.fromJson({'order': orderData});
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }

  Future<DeliveryOrdersResponse> fetchDeliveryHistory({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/orders/delivery/history',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return DeliveryOrdersResponse.fromJson(data);
    } on ApiException catch (e) {
      throw OrderException.fromApi(e);
    }
  }
}
