import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/delivery_profile_model.dart';
import 'api_service.dart';

final deliveryServiceProvider = Provider<DeliveryService>((ref) {
  return DeliveryService();
});

class DeliveryProfileException implements Exception {
  final int? statusCode;
  final List<String> messages;
  final String message;

  DeliveryProfileException({
    this.statusCode,
    List<String>? messages,
    String? message,
  })  : messages = messages ?? const [],
        message = message ?? 'Ocurrió un error, intenta nuevamente';

  factory DeliveryProfileException.fromApi(ApiException e) {
    return DeliveryProfileException(
      statusCode: e.statusCode,
      messages: e.validationMessages,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class DeliveryService {
  final ApiService _apiService = ApiService();

  Future<DeliveryProfile> createProfile(DeliveryProfilePayload payload) async {
    try {
      final response = await _apiService.post(
        '/delivery/profile',
        data: payload.toJson(),
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      await _handleAccessToken(data);
      return DeliveryProfile.fromJson(data);
    } on ApiException catch (e) {
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<DeliveryProfile> fetchProfile() async {
    try {
      final response = await _apiService.get('/delivery/profile');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return DeliveryProfile.fromJson(data);
      }
      throw DeliveryProfileException(
        statusCode: 404,
        message: 'Perfil de repartidor no encontrado',
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        throw DeliveryProfileException(
          statusCode: 404,
          message: 'Perfil de repartidor no encontrado',
        );
      }
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<bool> hasProfile() async {
    try {
      await fetchProfile();
      return true;
    } on DeliveryProfileException catch (e) {
      if (e.statusCode == 404) return false;
      rethrow;
    }
  }

  Future<VehicleRegistrationResponse> registerVehicle({
    required String imagePath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(imagePath),
      });
      final response = await _apiService.postMultipart(
        path: '/delivery/vehicle',
        formData: formData,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      await _handleAccessToken(data);
      return VehicleRegistrationResponse.fromJson(data);
    } on ApiException catch (e) {
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<VehicleRegistrationResponse> registerVehicleManual({
    required String plate,
    required String documentType,
    required String documentNumber,
  }) async {
    try {
      final response = await _apiService.post(
        '/delivery/vehicle/manual',
        data: {
          'plate': plate,
          'documentType': documentType,
          'documentNumber': documentNumber,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      await _handleAccessToken(data);
      return VehicleRegistrationResponse.fromJson(data);
    } on ApiException catch (e) {
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<void> verifyLicense({required String imagePath}) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(imagePath),
      });
      final response = await _apiService.postMultipart(
        path: '/delivery/license/verify',
        formData: formData,
      );
      await _handleAccessToken(response.data as Map<String, dynamic>?);
    } on ApiException catch (e) {
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<void> _handleAccessToken(Map<String, dynamic>? data) async {
    if (data != null && data['access_token'] is String) {
      final token = data['access_token'] as String;
      if (token.isNotEmpty) {
        final storage = _apiService.getStorage();
        final currentRefresh = await storage.getRefreshToken();
        if (currentRefresh != null) {
          await storage.saveTokens(
            accessToken: token,
            refreshToken: currentRefresh,
          );
        }
      }
    }
  }
}
