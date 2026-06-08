import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/restaurant_profile_model.dart';
import 'api_service.dart';

final restaurantServiceProvider = Provider<RestaurantService>((ref) {
  return RestaurantService();
});

class RestaurantProfileException implements Exception {
  final int? statusCode;
  final List<String> messages;
  final String message;

  RestaurantProfileException({
    this.statusCode,
    List<String>? messages,
    String? message,
  })  : messages = messages ?? const [],
        message = message ?? 'Ocurrió un error, intenta nuevamente';

  factory RestaurantProfileException.fromApi(ApiException e) {
    return RestaurantProfileException(
      statusCode: e.statusCode,
      messages: e.validationMessages,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class RestaurantService {
  final ApiService _apiService = ApiService();

  Future<RestaurantProfile> updateProfile(RestaurantProfileUpdatePayload payload) async {
    try {
      final response = await _apiService.patch(
        '/restaurant/profile',
        data: payload.toJson(),
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return RestaurantProfile.fromJson(data);
    } on ApiException catch (e) {
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<RestaurantProfile> createProfile(RestaurantProfilePayload payload) async {
    try {
      final response = await _apiService.post(
        '/restaurant/profile',
        data: payload.toJson(),
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      await _handleAccessToken(data);
      return RestaurantProfile.fromJson(data);
    } on ApiException catch (e) {
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<String> updateLogo(List<int> bytes, String filename) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: filename),
      });
      final response = await _apiService.patchMultipart(
        path: '/restaurant/profile/logo',
        formData: formData,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return data['logoUrl'] as String? ?? '';
    } on ApiException catch (e) {
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<String> updateBanner(List<int> bytes, String filename) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: filename),
      });
      final response = await _apiService.patchMultipart(
        path: '/restaurant/profile/banner',
        formData: formData,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return data['bannerUrl'] as String? ?? '';
    } on ApiException catch (e) {
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<void> deleteLogo() async {
    try {
      await _apiService.delete('/restaurant/profile/logo');
    } on ApiException catch (e) {
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<RestaurantProfile> fetchProfile() async {
    try {
      final response = await _apiService.get('/restaurant/profile');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return RestaurantProfile.fromJson(data);
      }
      throw RestaurantProfileException(
        message: 'Perfil de restaurante no encontrado',
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        throw RestaurantProfileException(
          statusCode: 404,
          message: 'Perfil de restaurante no encontrado',
        );
      }
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<bool> hasProfile() async {
    try {
      await fetchProfile();
      return true;
    } on RestaurantProfileException catch (e) {
      if (e.statusCode == 404) return false;
      rethrow;
    }
  }

  Future<RestaurantAddress?> fetchAddress() async {
    try {
      final response = await _apiService.get('/restaurant/address');
      final data = response.data;
      if (data is Map<String, dynamic> && data['address'] is Map<String, dynamic>) {
        return RestaurantAddress.fromJson(data['address'] as Map<String, dynamic>);
      }
      return null;
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<List<OpeningHour>> fetchOpeningHours() async {
    try {
      final response = await _apiService.get('/restaurant/opening-hours');
      final data = response.data as Map<String, dynamic>? ?? {};
      final hoursRaw = data['hours'];
      if (hoursRaw is List) {
        return hoursRaw
            .whereType<Map<String, dynamic>>()
            .map(OpeningHour.fromJson)
            .toList();
      }
      return [];
    } on ApiException catch (e) {
      if (e.statusCode == 404) return [];
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<RestaurantAddress> updateAddress(RestaurantAddressPayload payload) async {
    try {
      final response = await _apiService.put(
        '/restaurant/address',
        data: payload.toJson(),
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      await _handleAccessToken(data);
      return RestaurantAddress.fromJson(data);
    } on ApiException catch (e) {
      throw RestaurantProfileException.fromApi(e);
    }
  }

  Future<OpeningHoursResponse> updateOpeningHours(OpeningHoursPayload payload) async {
    try {
      final response = await _apiService.put(
        '/restaurant/opening-hours',
        data: payload.toJson(),
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      await _handleAccessToken(data);
      return OpeningHoursResponse.fromJson(data);
    } on ApiException catch (e) {
      throw RestaurantProfileException.fromApi(e);
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
