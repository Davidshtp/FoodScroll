class CustomerAddress {
  final String id;
  final String customerId;
  final String cityId;
  final String alias;
  final String mainAddress;
  final String neighborhood;
  final String? details;
  final double? latitude;
  final double? longitude;
  final String? createdAt;
  final String? updatedAt;
  final String? deletedAt;

  CustomerAddress({
    required this.id,
    required this.customerId,
    required this.cityId,
    required this.alias,
    required this.mainAddress,
    required this.neighborhood,
    this.details,
    this.latitude,
    this.longitude,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
  });

  factory CustomerAddress.fromJson(Map<String, dynamic> json) {
    return CustomerAddress(
      id: (json['id'] ?? '').toString(),
      customerId: (json['customerId'] ?? '').toString(),
      cityId: (json['cityId'] ?? '').toString(),
      alias: (json['alias'] ?? '').toString(),
      mainAddress: (json['mainAddress'] ?? '').toString(),
      neighborhood: (json['neighborhood'] ?? '').toString(),
      details: json['details']?.toString(),
      latitude: _toDouble(json['latitude']),
      longitude: _toDouble(json['longitude']),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      deletedAt: json['deletedAt']?.toString(),
    );
  }

  static double? _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value?.toString() ?? '');
  }
}

class Department {
  final String id;
  final String name;

  Department({
    required this.id,
    required this.name,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? json['departmentName'] ?? '').toString(),
    );
  }
}

class City {
  final String id;
  final String name;
  final String? departmentId;

  City({
    required this.id,
    required this.name,
    this.departmentId,
  });

  factory City.fromJson(Map<String, dynamic> json) {
    return City(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? json['cityName'] ?? '').toString(),
      departmentId: json['departmentId']?.toString(),
    );
  }
}

class ReverseGeocodeResult {
  final String? cityId;
  final String? mainAddress;
  final double? latitude;
  final double? longitude;

  ReverseGeocodeResult({
    this.cityId,
    this.mainAddress,
    this.latitude,
    this.longitude,
  });

  factory ReverseGeocodeResult.fromJson(Map<String, dynamic> json) {
    return ReverseGeocodeResult(
      cityId: json['cityId']?.toString(),
      mainAddress: json['mainAddress']?.toString(),
      latitude: _toDouble(json['latitude']),
      longitude: _toDouble(json['longitude']),
    );
  }

  static double? _toDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value?.toString() ?? '');
  }
}

class AddressPayload {
  final String alias;
  final String cityId;
  final String details;
  final double latitude;
  final double longitude;
  final String mainAddress;
  final String neighborhood;

  AddressPayload({
    required this.alias,
    required this.cityId,
    required this.details,
    required this.latitude,
    required this.longitude,
    required this.mainAddress,
    required this.neighborhood,
  });

  Map<String, dynamic> toJson() {
    return {
      'alias': alias,
      'cityId': cityId,
      'details': details,
      'latitude': latitude,
      'longitude': longitude,
      'mainAddress': mainAddress,
      'neighborhood': neighborhood,
    };
  }
}
