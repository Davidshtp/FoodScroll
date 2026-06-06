class OrderItem {
  final String id;
  final String publicationId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? observation;
  final String? createdAt;
  final String? updatedAt;

  const OrderItem({
    required this.id,
    required this.publicationId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.observation,
    this.createdAt,
    this.updatedAt,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: (json['id'] ?? '').toString(),
      publicationId: (json['publicationId'] ?? '').toString(),
      productName: (json['productName'] ?? '').toString(),
      quantity: (json['quantity'] ?? 0) as int,
      unitPrice: _toDouble(json['unitPrice']),
      totalPrice: _toDouble(json['totalPrice']),
      observation: json['observation']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '0') ?? 0;
  }
}

class RestaurantOrder {
  final String id;
  final String customerId;
  final String restaurantId;
  final String? deliveryId;
  final String? customerAddressId;
  final String status;
  final double totalAmount;
  final List<OrderItem> orderItems;
  final String createdAt;
  final String updatedAt;
  final String? deletedAt;

  const RestaurantOrder({
    required this.id,
    required this.customerId,
    required this.restaurantId,
    this.deliveryId,
    this.customerAddressId,
    required this.status,
    required this.totalAmount,
    this.orderItems = const [],
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
  });

  factory RestaurantOrder.fromJson(Map<String, dynamic> json) {
    final items = json['orderItems'];
    return RestaurantOrder(
      id: (json['id'] ?? '').toString(),
      customerId: (json['customerId'] ?? '').toString(),
      restaurantId: (json['restaurantId'] ?? '').toString(),
      deliveryId: json['deliveryId']?.toString(),
      customerAddressId: json['customerAddressId']?.toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      totalAmount: _toDouble(json['totalAmount']),
      orderItems: items is List
          ? items.whereType<Map<String, dynamic>>().map(OrderItem.fromJson).toList()
          : [],
      createdAt: (json['createdAt'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? '').toString(),
      deletedAt: json['deletedAt']?.toString(),
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '0') ?? 0;
  }

  String get statusLabel {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pendiente';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PREPARING':
        return 'En preparación';
      case 'READY_FOR_PICKUP':
        return 'Listo para recoger';
      case 'DELIVERED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }
}

class OrdersResponse {
  final List<RestaurantOrder> orders;
  final PaginationInfo? pagination;

  const OrdersResponse({
    this.orders = const [],
    this.pagination,
  });

  factory OrdersResponse.fromJson(Map<String, dynamic> json) {
    final ordersRaw = json['orders'];
    return OrdersResponse(
      orders: ordersRaw is List
          ? ordersRaw
              .whereType<Map<String, dynamic>>()
              .map(RestaurantOrder.fromJson)
              .toList()
          : [],
      pagination: json['pagination'] != null
          ? PaginationInfo.fromJson(json['pagination'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PaginationInfo {
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const PaginationInfo({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory PaginationInfo.fromJson(Map<String, dynamic> json) {
    return PaginationInfo(
      total: (json['total'] ?? 0) as int,
      page: (json['page'] ?? 1) as int,
      limit: (json['limit'] ?? 20) as int,
      totalPages: (json['totalPages'] ?? 1) as int,
    );
  }
}
