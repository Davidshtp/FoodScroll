import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/customer_profile_model.dart';
import 'api_service.dart';

final customerServiceProvider = Provider<CustomerService>((ref) {
  return CustomerService();
});

class CustomerProfileException implements Exception {
  final int? statusCode;
  final List<String> messages;
  final String message;

  CustomerProfileException({
    this.statusCode,
    List<String>? messages,
    String? message,
  })  : messages = messages ?? const [],
        message = message ?? 'Ocurrió un error, intenta nuevamente';

  factory CustomerProfileException.fromApi(ApiException e) {
    return CustomerProfileException(
      statusCode: e.statusCode,
      messages: e.validationMessages,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class CustomerService {
  final ApiService _apiService = ApiService();

  Future<CustomerProfile> createProfile(CustomerProfilePayload payload) async {
    try {
      final response = await _apiService.post(
        '/customer/profile',
        data: payload.toJson(),
      );

      final data = response.data as Map<String, dynamic>? ?? {};
      await _handleAccessToken(data);
      return CustomerProfile.fromJson(data);
    } on ApiException catch (e) {
      throw CustomerProfileException.fromApi(e);
    }
  }

  Future<CustomerProfile> updateProfile(CustomerProfilePayload payload) async {
    try {
      final response = await _apiService.patch(
        '/customer/profile',
        data: payload.toJson(),
      );

      return CustomerProfile.fromJson(
        (response.data as Map<String, dynamic>?) ?? const {},
      );
    } on ApiException catch (e) {
      throw CustomerProfileException.fromApi(e);
    }
  }

  Future<String> updateAvatar(List<int> bytes, String filename) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: filename),
      });
      final response = await _apiService.patchMultipart(
        path: '/customer/profile/avatar',
        formData: formData,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return data['avatarUrl'] as String? ?? '';
    } on ApiException catch (e) {
      throw CustomerProfileException.fromApi(e);
    }
  }

  Future<void> deleteAvatar() async {
    try {
      await _apiService.delete('/customer/profile/avatar');
    } on ApiException catch (e) {
      throw CustomerProfileException.fromApi(e);
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

  Future<CustomerProfile> fetchProfile() async {
    try {
      final response = await _apiService.get('/customer/profile');
      return CustomerProfile.fromJson(
        (response.data as Map<String, dynamic>?) ?? const {},
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        throw CustomerProfileException(
          statusCode: 404,
          message: 'Perfil no encontrado',
        );
      }
      if (e.statusCode == 403) {
        throw CustomerProfileException(
          statusCode: 403,
          message: e.displayMessage,
        );
      }
      throw CustomerProfileException.fromApi(e);
    }
  }
}
