import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/publication_model.dart';
import 'api_service.dart';

final publicationServiceProvider = Provider<PublicationService>((ref) {
  return PublicationService();
});

class PublicationException implements Exception {
  final int? statusCode;
  final String message;

  PublicationException({this.statusCode, String? message})
      : message = message ?? 'Ocurrió un error, intenta nuevamente';

  factory PublicationException.fromApi(ApiException e) {
    return PublicationException(
      statusCode: e.statusCode,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class PublicationService {
  final ApiService _apiService = ApiService();

  Future<List<RestaurantPublication>> fetchPublications() async {
    try {
      final response = await _apiService.get('/restaurant/publications');
      final data = response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map(RestaurantPublication.fromJson)
            .toList();
      }
      return [];
    } on ApiException catch (e) {
      throw PublicationException.fromApi(e);
    }
  }

  Future<RestaurantPublication> fetchPublicationById(String id) async {
    try {
      final response = await _apiService.get('/restaurant/publications/$id');
      final data = response.data as Map<String, dynamic>? ?? {};
      return RestaurantPublication.fromJson(data);
    } on ApiException catch (e) {
      throw PublicationException.fromApi(e);
    }
  }

  Future<RestaurantPublication> createPublication({
    required String title,
    required String description,
    required String type,
    required String price,
    List<FilePayload>? files,
  }) async {
    try {
      final formData = FormData();
      formData.fields.addAll([
        MapEntry('title', title),
        MapEntry('description', description),
        MapEntry('type', type),
        MapEntry('price', price),
      ]);
      if (files != null) {
        for (final file in files) {
          formData.files.add(MapEntry(
            'files',
            MultipartFile.fromBytes(file.bytes, filename: file.name),
          ));
        }
      }
      final response = await _apiService.postMultipart(
        path: '/restaurant/publications',
        formData: formData,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return RestaurantPublication.fromJson(data);
    } on ApiException catch (e) {
      throw PublicationException.fromApi(e);
    }
  }

  Future<RestaurantPublication> updatePublication({
    required String id,
    String? title,
    String? description,
    String? type,
    String? price,
    List<String>? imageUrlsToDelete,
    List<FilePayload>? files,
  }) async {
    try {
      final formData = FormData();
      if (title != null) formData.fields.add(MapEntry('title', title));
      if (description != null) {
        formData.fields.add(MapEntry('description', description));
      }
      if (type != null) formData.fields.add(MapEntry('type', type));
      if (price != null) formData.fields.add(MapEntry('price', price));
      if (imageUrlsToDelete != null && imageUrlsToDelete.isNotEmpty) {
        formData.fields.add(MapEntry(
          'imageUrlsToDelete',
          jsonEncode(imageUrlsToDelete),
        ));
      }
      if (files != null) {
        for (final file in files) {
          formData.files.add(MapEntry(
            'files',
            MultipartFile.fromBytes(file.bytes, filename: file.name),
          ));
        }
      }
      final response = await _apiService.patchMultipart(
        path: '/restaurant/publications/$id',
        formData: formData,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return RestaurantPublication.fromJson(data);
    } on ApiException catch (e) {
      throw PublicationException.fromApi(e);
    }
  }

  Future<void> deletePublication(String id) async {
    try {
      await _apiService.delete('/restaurant/publications/$id');
    } on ApiException catch (e) {
      throw PublicationException.fromApi(e);
    }
  }
}

class FilePayload {
  final List<int> bytes;
  final String name;

  const FilePayload({required this.bytes, required this.name});
}
