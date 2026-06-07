import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/feed_publication_model.dart';
import 'api_service.dart';

final feedServiceProvider = Provider<FeedService>((ref) {
  return FeedService();
});

class FeedException implements Exception {
  final int? statusCode;
  final String message;

  FeedException({this.statusCode, String? message})
      : message = message ?? 'Ocurrió un error, intenta nuevamente';

  factory FeedException.fromApi(ApiException e) {
    return FeedException(
      statusCode: e.statusCode,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class FeedService {
  final ApiService _apiService = ApiService();

  Future<FeedResponse> fetchFeed({
    double? latitude,
    double? longitude,
  }) async {
    try {
      final query = <String, dynamic>{};
      if (latitude != null) query['latitude'] = latitude;
      if (longitude != null) query['longitude'] = longitude;

      final response = await _apiService.get(
        '/publications/feed',
        queryParameters: query.isNotEmpty ? query : null,
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return FeedResponse.fromJson(data);
    } on ApiException catch (e) {
      throw FeedException.fromApi(e);
    }
  }
}
