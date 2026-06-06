class DeliveryProfile {
  final String id;
  final String userId;
  final String firstName;
  final String lastName;
  final String phone;
  final String documentType;
  final String documentNumber;
  final String birthDate;
  final String gender;
  final String vehicleType;
  final String? avatarUrl;
  final String? createdAt;
  final String? updatedAt;

  const DeliveryProfile({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.documentType,
    required this.documentNumber,
    required this.birthDate,
    required this.gender,
    required this.vehicleType,
    this.avatarUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory DeliveryProfile.fromJson(Map<String, dynamic> json) {
    final data = json['profile'] is Map<String, dynamic>
        ? json['profile'] as Map<String, dynamic>
        : json;
    return DeliveryProfile(
      id: (data['id'] ?? '').toString(),
      userId: (data['userId'] ?? '').toString(),
      firstName: (data['firstName'] ?? '').toString(),
      lastName: (data['lastName'] ?? '').toString(),
      phone: (data['phone'] ?? '').toString(),
      documentType: (data['documentType'] ?? '').toString(),
      documentNumber: (data['documentNumber'] ?? '').toString(),
      birthDate: (data['birthDate'] ?? '').toString(),
      gender: (data['gender'] ?? '').toString(),
      vehicleType: (data['vehicleType'] ?? '').toString(),
      avatarUrl: data['avatarUrl']?.toString(),
      createdAt: data['createdAt']?.toString(),
      updatedAt: data['updatedAt']?.toString(),
    );
  }
}

class DeliveryProfileUpdatePayload {
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? documentType;
  final String? documentNumber;
  final String? birthDate;
  final String? gender;
  final String? vehicleType;

  const DeliveryProfileUpdatePayload({
    this.firstName,
    this.lastName,
    this.phone,
    this.documentType,
    this.documentNumber,
    this.birthDate,
    this.gender,
    this.vehicleType,
  });

  Map<String, dynamic> toJson() {
    return {
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
      if (phone != null) 'phone': phone,
      if (documentType != null) 'documentType': documentType,
      if (documentNumber != null) 'documentNumber': documentNumber,
      if (birthDate != null) 'birthDate': birthDate,
      if (gender != null) 'gender': gender,
      if (vehicleType != null) 'vehicleType': vehicleType,
    };
  }
}

class DeliveryProfilePayload {
  final String firstName;
  final String lastName;
  final String phone;
  final String documentType;
  final String documentNumber;
  final String birthDate;
  final String gender;
  final String vehicleType;

  const DeliveryProfilePayload({
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.documentType,
    required this.documentNumber,
    required this.birthDate,
    required this.gender,
    required this.vehicleType,
  });

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'documentType': documentType,
      'documentNumber': documentNumber,
      'birthDate': birthDate,
      'gender': gender,
      'vehicleType': vehicleType,
    };
  }
}

class VehicleInfo {
  final String id;
  final String profileId;
  final String vehicleType;
  final String plate;

  VehicleInfo({
    required this.id,
    required this.profileId,
    required this.vehicleType,
    required this.plate,
  });

  factory VehicleInfo.fromJson(Map<String, dynamic> json) {
    return VehicleInfo(
      id: (json['id'] ?? '').toString(),
      profileId: (json['profileId'] ?? '').toString(),
      vehicleType: (json['vehicleType'] ?? '').toString(),
      plate: (json['plate'] ?? '').toString(),
    );
  }
}

class VehicleStatus {
  final bool canWork;
  final List<String> reasons;

  VehicleStatus({
    required this.canWork,
    required this.reasons,
  });

  factory VehicleStatus.fromJson(Map<String, dynamic> json) {
    final reasonsRaw = json['reasons'];
    return VehicleStatus(
      canWork: json['canWork'] == true,
      reasons: reasonsRaw is List ? reasonsRaw.map((e) => e.toString()).toList() : [],
    );
  }
}

class VehicleRegistrationResponse {
  final String message;
  final VehicleInfo vehicle;
  final VehicleStatus status;
  final String? accessToken;

  VehicleRegistrationResponse({
    required this.message,
    required this.vehicle,
    required this.status,
    this.accessToken,
  });

  factory VehicleRegistrationResponse.fromJson(Map<String, dynamic> json) {
    return VehicleRegistrationResponse(
      message: (json['message'] ?? '').toString(),
      vehicle: VehicleInfo.fromJson(
        (json['vehicle'] as Map<String, dynamic>?) ?? {},
      ),
      status: VehicleStatus.fromJson(
        (json['status'] as Map<String, dynamic>?) ?? {},
      ),
      accessToken: json['access_token']?.toString(),
    );
  }
}
