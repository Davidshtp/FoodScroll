class RestaurantProfile {
  final String id;
  final String userId;
  final String name;
  final String description;
  final String phone;
  final String email;
  final String? logoUrl;
  final String? bannerUrl;
  final String? createdAt;
  final String? updatedAt;

  const RestaurantProfile({
    required this.id,
    required this.userId,
    required this.name,
    required this.description,
    required this.phone,
    required this.email,
    this.logoUrl,
    this.bannerUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory RestaurantProfile.fromJson(Map<String, dynamic> json) {
    return RestaurantProfile(
      id: (json['id'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      logoUrl: json['logoUrl']?.toString(),
      bannerUrl: json['bannerUrl']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class RestaurantProfilePayload {
  final String name;
  final String description;
  final String phone;
  final String email;

  const RestaurantProfilePayload({
    required this.name,
    required this.description,
    required this.phone,
    required this.email,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'phone': phone,
      'email': email,
    };
  }
}

class RestaurantAddressPayload {
  final String address;
  final String cityId;
  final double latitude;
  final double longitude;

  const RestaurantAddressPayload({
    required this.address,
    required this.cityId,
    required this.latitude,
    required this.longitude,
  });

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'cityId': cityId,
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}

class RestaurantAddress {
  final String id;
  final String restaurantId;
  final String address;
  final String cityId;
  final double? latitude;
  final double? longitude;
  final String? createdAt;
  final String? updatedAt;

  RestaurantAddress({
    required this.id,
    required this.restaurantId,
    required this.address,
    required this.cityId,
    this.latitude,
    this.longitude,
    this.createdAt,
    this.updatedAt,
  });

  factory RestaurantAddress.fromJson(Map<String, dynamic> json) {
    return RestaurantAddress(
      id: (json['id'] ?? '').toString(),
      restaurantId: (json['restaurantId'] ?? '').toString(),
      address: (json['address'] ?? '').toString(),
      cityId: (json['cityId'] ?? '').toString(),
      latitude: _toDouble(json['latitude']),
      longitude: _toDouble(json['longitude']),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }

  static double? _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '');
  }
}

class OpeningHour {
  final int dayOfWeek;
  final String? openTime;
  final String? closeTime;
  final bool isClosed;

  OpeningHour({
    required this.dayOfWeek,
    this.openTime,
    this.closeTime,
    this.isClosed = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'dayOfWeek': dayOfWeek,
      if (openTime != null) 'openTime': openTime,
      if (closeTime != null) 'closeTime': closeTime,
      'isClosed': isClosed,
    };
  }

  factory OpeningHour.fromJson(Map<String, dynamic> json) {
    return OpeningHour(
      dayOfWeek: (json['dayOfWeek'] ?? 0) as int,
      openTime: json['openTime']?.toString(),
      closeTime: json['closeTime']?.toString(),
      isClosed: json['isClosed'] == true,
    );
  }
}

class OpeningHoursPayload {
  final List<OpeningHour> hours;

  OpeningHoursPayload({required this.hours});

  Map<String, dynamic> toJson() {
    return {
      'hours': hours.map((h) => h.toJson()).toList(),
    };
  }
}

class OpeningHoursResponse {
  final List<OpeningHour> hours;
  final String? accessToken;

  OpeningHoursResponse({
    required this.hours,
    this.accessToken,
  });

  factory OpeningHoursResponse.fromJson(Map<String, dynamic> json) {
    final hoursRaw = json['hours'];
    return OpeningHoursResponse(
      hours: hoursRaw is List
          ? hoursRaw
              .whereType<Map<String, dynamic>>()
              .map(OpeningHour.fromJson)
              .toList()
          : [],
      accessToken: json['access_token']?.toString(),
    );
  }
}
