import 'order_model.dart';

class DeliveryOrder {
  final RestaurantOrder order;
  final DeliveryRestaurantInfo? restaurant;
  final DeliveryAddressInfo? deliveryAddress;
  final DeliveryCustomerInfo? customer;

  const DeliveryOrder({
    required this.order,
    this.restaurant,
    this.deliveryAddress,
    this.customer,
  });

  factory DeliveryOrder.fromJson(Map<String, dynamic> json) {
    final orderJson = json['order'] as Map<String, dynamic>? ?? json;
    final restJson = json['restaurant'] as Map<String, dynamic>?;
    final addrJson = json['deliveryAddress'] as Map<String, dynamic>?;
    final custJson = json['customer'] as Map<String, dynamic>?;

    return DeliveryOrder(
      order: RestaurantOrder.fromJson(orderJson),
      restaurant: restJson != null ? DeliveryRestaurantInfo.fromJson(restJson) : null,
      deliveryAddress: addrJson != null ? DeliveryAddressInfo.fromJson(addrJson) : null,
      customer: custJson != null ? DeliveryCustomerInfo.fromJson(custJson) : null,
    );
  }

  DeliveryOrder copyWithOrderStatus(String newStatus) {
    return DeliveryOrder(
      order: order.copyWithStatus(newStatus),
      restaurant: restaurant,
      deliveryAddress: deliveryAddress,
      customer: customer,
    );
  }
}

class DeliveryRestaurantInfo {
  final String? name;
  final DeliveryAddressInfo? address;

  const DeliveryRestaurantInfo({this.name, this.address});

  factory DeliveryRestaurantInfo.fromJson(Map<String, dynamic> json) {
    final addrJson = json['address'] as Map<String, dynamic>?;
    return DeliveryRestaurantInfo(
      name: (json['name'] ?? '').toString(),
      address: addrJson != null ? DeliveryAddressInfo.fromJson(addrJson) : null,
    );
  }
}

class DeliveryAddressInfo {
  final String id;
  final String? details;
  final String? mainAddress;
  final String neighborhood;
  final double latitude;
  final double longitude;
  final String cityName;

  const DeliveryAddressInfo({
    required this.id,
    this.details,
    this.mainAddress,
    this.neighborhood = '',
    this.latitude = 0,
    this.longitude = 0,
    this.cityName = '',
  });

  factory DeliveryAddressInfo.fromJson(Map<String, dynamic> json) {
    return DeliveryAddressInfo(
      id: (json['id'] ?? '').toString(),
      details: json['details']?.toString(),
      mainAddress: json['mainAddress']?.toString(),
      neighborhood: (json['neighborhood'] ?? '').toString(),
      latitude: _toDouble(json['latitude']),
      longitude: _toDouble(json['longitude']),
      cityName: (json['cityName'] ?? '').toString(),
    );
  }

  String get displayAddress {
    final parts = <String>[
      if (mainAddress != null && mainAddress!.isNotEmpty) mainAddress!,
      if (details != null && details!.isNotEmpty) details!,
      if (neighborhood.isNotEmpty) neighborhood,
      if (cityName.isNotEmpty) cityName,
    ];
    return parts.isNotEmpty ? parts.join(', ') : 'Dirección no disponible';
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '0') ?? 0;
  }
}

class DeliveryCustomerInfo {
  final String userId;
  final String firstName;
  final String lastName;
  final String phone;
  final String? avatarUrl;

  const DeliveryCustomerInfo({
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.phone,
    this.avatarUrl,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory DeliveryCustomerInfo.fromJson(Map<String, dynamic> json) {
    return DeliveryCustomerInfo(
      userId: (json['userId'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      avatarUrl: json['avatarUrl']?.toString(),
    );
  }
}

class DeliveryOrdersResponse {
  final List<DeliveryOrder> orders;
  final PaginationInfo? pagination;

  const DeliveryOrdersResponse({this.orders = const [], this.pagination});

  factory DeliveryOrdersResponse.fromJson(Map<String, dynamic> json) {
    final ordersRaw = json['orders'];
    return DeliveryOrdersResponse(
      orders: ordersRaw is List
          ? ordersRaw
              .whereType<Map<String, dynamic>>()
              .map(DeliveryOrder.fromJson)
              .toList()
          : [],
      pagination: json['pagination'] != null
          ? PaginationInfo.fromJson(json['pagination'] as Map<String, dynamic>)
          : null,
    );
  }
}


