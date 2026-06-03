import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/address_model.dart';
import 'api_service.dart';

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

class LocationServiceException implements Exception {
  final int? statusCode;
  final String message;

  LocationServiceException({this.statusCode, required this.message});

  factory LocationServiceException.fromApi(ApiException e) {
    return LocationServiceException(
      statusCode: e.statusCode,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class LocationService {
  final ApiService _apiService = ApiService();

  Future<List<Department>> fetchDepartments() async {
    try {
      final response = await _apiService.get(
        '/location/department',
        sendAuth: false,
      );
      return _parseList(response.data)
          .map((item) => Department.fromJson(item))
          .toList();
    } on ApiException catch (e) {
      throw LocationServiceException.fromApi(e);
    }
  }

  Future<List<City>> fetchCitiesByDepartment(String departmentId) async {
    try {
      final response = await _apiService.get(
        '/location/city/by-department/$departmentId',
        sendAuth: false,
      );
      return _parseList(response.data)
          .map((item) => City.fromJson(item))
          .toList();
    } on ApiException catch (e) {
      throw LocationServiceException.fromApi(e);
    }
  }

  Future<City> fetchCityById(String cityId) async {
    try {
      final response = await _apiService.get(
        '/location/city/$cityId',
        sendAuth: false,
      );
      return City.fromJson(
        (response.data as Map<String, dynamic>?) ?? const {},
      );
    } on ApiException catch (e) {
      throw LocationServiceException.fromApi(e);
    }
  }

  Future<ReverseGeocodeResult> reverseGeocode({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final response = await _apiService.get(
        '/location/geocode/reverse',
        queryParameters: {
          'latitude': latitude,
          'longitude': longitude,
        },
      );

      if (response.data is Map<String, dynamic>) {
        return ReverseGeocodeResult.fromJson(
          response.data as Map<String, dynamic>,
        );
      }

      return ReverseGeocodeResult(
        latitude: latitude,
        longitude: longitude,
      );
    } on ApiException catch (e) {
      throw LocationServiceException.fromApi(e);
    }
  }

  List<Map<String, dynamic>> _parseList(dynamic data) {
    if (data is List) {
      return data.whereType<Map<String, dynamic>>().toList();
    }
    return [];
  }
}
