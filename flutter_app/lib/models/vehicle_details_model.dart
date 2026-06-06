class VehicleDetails {
  final VehicleData vehicle;
  final List<SoatInfo> soats;
  final List<TechnoInfo> technos;

  const VehicleDetails({
    required this.vehicle,
    this.soats = const [],
    this.technos = const [],
  });

  factory VehicleDetails.fromJson(Map<String, dynamic> json) {
    final vehicleRaw = json['vehicle'] as Map<String, dynamic>? ?? {};
    final soatsRaw = json['soats'] as List? ?? [];
    final technosRaw = json['technos'] as List? ?? [];

    return VehicleDetails(
      vehicle: VehicleData.fromJson(vehicleRaw),
      soats: soatsRaw
          .whereType<Map<String, dynamic>>()
          .map(SoatInfo.fromJson)
          .toList(),
      technos: technosRaw
          .whereType<Map<String, dynamic>>()
          .map(TechnoInfo.fromJson)
          .toList(),
    );
  }
}

class VehicleData {
  final String id;
  final String profileId;
  final String vehicleType;
  final String plate;
  final String brand;
  final String line;
  final int modelYear;
  final String color;
  final String soatStatus;
  final String? soatExpiry;
  final String technoStatus;
  final String? technoExpiry;
  final String? createdAt;
  final String? updatedAt;

  const VehicleData({
    required this.id,
    required this.profileId,
    required this.vehicleType,
    required this.plate,
    required this.brand,
    required this.line,
    required this.modelYear,
    required this.color,
    required this.soatStatus,
    this.soatExpiry,
    required this.technoStatus,
    this.technoExpiry,
    this.createdAt,
    this.updatedAt,
  });

  factory VehicleData.fromJson(Map<String, dynamic> json) {
    return VehicleData(
      id: (json['id'] ?? '').toString(),
      profileId: (json['profileId'] ?? '').toString(),
      vehicleType: (json['vehicleType'] ?? '').toString(),
      plate: (json['plate'] ?? '').toString(),
      brand: (json['brand'] ?? '').toString(),
      line: (json['line'] ?? '').toString(),
      modelYear: (json['modelYear'] ?? 0) as int,
      color: (json['color'] ?? '').toString(),
      soatStatus: (json['soatStatus'] ?? '').toString(),
      soatExpiry: json['soatExpiry']?.toString(),
      technoStatus: (json['technoStatus'] ?? '').toString(),
      technoExpiry: json['technoExpiry']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }
}

class SoatInfo {
  final String id;
  final String vehicleId;
  final String policyNumber;
  final String insurer;
  final String status;
  final String issuanceStatus;
  final String origin;
  final String tariffType;
  final String issuedAt;
  final String startDate;
  final String endDate;
  final String? createdAt;

  const SoatInfo({
    required this.id,
    required this.vehicleId,
    required this.policyNumber,
    required this.insurer,
    required this.status,
    required this.issuanceStatus,
    required this.origin,
    required this.tariffType,
    required this.issuedAt,
    required this.startDate,
    required this.endDate,
    this.createdAt,
  });

  factory SoatInfo.fromJson(Map<String, dynamic> json) {
    return SoatInfo(
      id: (json['id'] ?? '').toString(),
      vehicleId: (json['vehicleId'] ?? '').toString(),
      policyNumber: (json['policyNumber'] ?? '').toString(),
      insurer: (json['insurer'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      issuanceStatus: (json['issuanceStatus'] ?? '').toString(),
      origin: (json['origin'] ?? '').toString(),
      tariffType: (json['tariffType'] ?? '').toString(),
      issuedAt: (json['issuedAt'] ?? '').toString(),
      startDate: (json['startDate'] ?? '').toString(),
      endDate: (json['endDate'] ?? '').toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class TechnoInfo {
  final String id;
  final String vehicleId;
  final String certificateNumber;
  final String reviewType;
  final String cdaName;
  final String status;
  final String isCurrent;
  final String issuedAt;
  final String expiresAt;
  final String plate;
  final String consistency;
  final String? certificateUrl;
  final String? createdAt;

  const TechnoInfo({
    required this.id,
    required this.vehicleId,
    required this.certificateNumber,
    required this.reviewType,
    required this.cdaName,
    required this.status,
    required this.isCurrent,
    required this.issuedAt,
    required this.expiresAt,
    required this.plate,
    required this.consistency,
    this.certificateUrl,
    this.createdAt,
  });

  factory TechnoInfo.fromJson(Map<String, dynamic> json) {
    return TechnoInfo(
      id: (json['id'] ?? '').toString(),
      vehicleId: (json['vehicleId'] ?? '').toString(),
      certificateNumber: (json['certificateNumber'] ?? '').toString(),
      reviewType: (json['reviewType'] ?? '').toString(),
      cdaName: (json['cdaName'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      isCurrent: (json['isCurrent'] ?? '').toString(),
      issuedAt: (json['issuedAt'] ?? '').toString(),
      expiresAt: (json['expiresAt'] ?? '').toString(),
      plate: (json['plate'] ?? '').toString(),
      consistency: (json['consistency'] ?? '').toString(),
      certificateUrl: json['certificateUrl']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}
