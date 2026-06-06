import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/delivery_profile_model.dart';
import '../models/vehicle_details_model.dart';
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

  Future<DeliveryProfile> updateProfile(DeliveryProfileUpdatePayload payload) async {
    try {
      final response = await _apiService.patch(
        '/delivery/profile',
        data: payload.toJson(),
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return DeliveryProfile.fromJson(data);
    } on ApiException catch (e) {
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<VehicleDetails> fetchVehicle() async {
    try {
      final response = await _apiService.get('/delivery/vehicle');
      final data = response.data as Map<String, dynamic>? ?? {};
      return VehicleDetails.fromJson(data);
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        throw DeliveryProfileException(
          statusCode: 404,
          message: 'No tienes un vehículo activo',
        );
      }
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<void> deleteVehicle() async {
    try {
      await _apiService.delete('/delivery/vehicle');
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        throw DeliveryProfileException(
          statusCode: 404,
          message: 'No tienes un vehículo activo para eliminar',
        );
      }
      throw DeliveryProfileException.fromApi(e);
    }
  }

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

  Future<String> updateAvatar(List<int> bytes, String filename) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: filename),
      });
      final response = await _apiService.patchMultipart(
        path: '/delivery/profile/avatar',
        formData: formData,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return data['avatarUrl'] as String? ?? '';
    } on ApiException catch (e) {
      throw DeliveryProfileException.fromApi(e);
    }
  }

  Future<void> deleteAvatar() async {
    try {
      await _apiService.delete('/delivery/profile/avatar');
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
    required List<int> imageBytes,
    required String imageName,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image': MultipartFile.fromBytes(imageBytes, filename: imageName),
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

  Future<void> verifyLicense({
    required List<int> imageBytes,
    required String imageName,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image': MultipartFile.fromBytes(imageBytes, filename: imageName),
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
