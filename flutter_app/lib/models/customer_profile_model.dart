import 'address_model.dart';

class CustomerProfile {
  final String id;
  final String userId;
  final String firstName;
  final String lastName;
  final String phone;
  final String? avatarUrl;
  final String? birthDate;
  final String? gender;
  final String? createdAt;
  final String? updatedAt;
  final String? deletedAt;
  final List<CustomerAddress> addresses;

  const CustomerProfile({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.phone,
    this.avatarUrl,
    this.birthDate,
    this.gender,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
    this.addresses = const [],
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    final addressesRaw = json['addresses'];
    final addresses = <CustomerAddress>[];
    if (addressesRaw is List) {
      for (final item in addressesRaw) {
        if (item is Map<String, dynamic>) {
          addresses.add(CustomerAddress.fromJson(item));
        }
      }
    }

    return CustomerProfile(
      id: (json['id'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      birthDate: json['birthDate']?.toString(),
      gender: json['gender']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
      deletedAt: json['deletedAt']?.toString(),
      addresses: addresses,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'birthDate': _formatBirthDateForRequest(birthDate),
      if (gender != null) 'gender': gender,
    };
  }

  static String? _formatBirthDateForRequest(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }
    if (value.length >= 10) {
      return value.substring(0, 10);
    }
    return value;
  }
}

class CustomerProfilePayload {
  final String firstName;
  final String lastName;
  final String phone;
  final String birthDate;
  final String gender;

  const CustomerProfilePayload({
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.birthDate,
    required this.gender,
  });

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'birthDate': birthDate,
      'gender': gender,
    };
  }
}
