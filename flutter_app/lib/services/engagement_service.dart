import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import 'api_service.dart';

final engagementServiceProvider = Provider<EngagementService>((ref) {
  return EngagementService();
});

class EngagementException implements Exception {
  final int? statusCode;
  final String message;

  EngagementException({this.statusCode, String? message})
      : message = message ?? 'Ocurrió un error, intenta nuevamente';

  factory EngagementException.fromApi(ApiException e) {
    return EngagementException(
      statusCode: e.statusCode,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class EngagementService {
  final ApiService _apiService = ApiService();

  Future<int> followersCount(String userId) async {
    try {
      final response = await _apiService.get('/engagement/followers/$userId/count');
      final data = response.data as Map<String, dynamic>? ?? {};
      return (data['count'] ?? 0) as int;
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<LikeResponse> toggleLike(String publicationId) async {
    try {
      final response = await _apiService.post(
        '/engagement/likes/toggle/$publicationId',
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return LikeResponse(
        liked: data['liked'] == true,
        count: (data['count'] ?? 0) as int,
      );
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<int> likeCount(String publicationId) async {
    try {
      final response = await _apiService.get(
        '/engagement/likes/count/$publicationId',
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return (data['count'] ?? 0) as int;
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<bool> checkLike(String publicationId) async {
    try {
      final response = await _apiService.get(
        '/engagement/likes/check/$publicationId',
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return data['liked'] == true;
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<Comment> addComment({
    required String publicationId,
    required String text,
    String? parentId,
  }) async {
    try {
      final response = await _apiService.post(
        '/engagement/comments',
        data: {
          'publicationId': publicationId,
          'text': text,
          if (parentId != null) 'parentId': parentId,
        },
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return Comment.fromJson(data);
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<List<Comment>> getComments(String publicationId) async {
    try {
      final response = await _apiService.get(
        '/engagement/comments/$publicationId',
      );
      final data = response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map(Comment.fromJson)
            .toList();
      }
      return [];
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<void> deleteComment(String commentId) async {
    try {
      await _apiService.delete('/engagement/comments/$commentId');
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<int> commentCount(String publicationId) async {
    try {
      final response = await _apiService.get(
        '/engagement/comments/$publicationId/count',
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return (data['count'] ?? 0) as int;
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<void> followRestaurant(String restaurantUserId) async {
    try {
      await _apiService.post('/engagement/followers/follow/$restaurantUserId');
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<void> unfollowRestaurant(String restaurantUserId) async {
    try {
      await _apiService.delete('/engagement/followers/follow/$restaurantUserId');
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }

  Future<bool> checkFollow(String restaurantUserId) async {
    try {
      final response = await _apiService.get(
        '/engagement/followers/check/$restaurantUserId',
      );
      final data = response.data as Map<String, dynamic>? ?? {};
      return data['followed'] == true;
    } on ApiException catch (e) {
      throw EngagementException.fromApi(e);
    }
  }
}

class LikeResponse {
  final bool liked;
  final int count;

  const LikeResponse({required this.liked, required this.count});
}

class Comment {
  final String id;
  final String userId;
  final String userRole;
  final String publicationId;
  final String text;
  final String? parentId;
  final String createdAt;

  const Comment({
    required this.id,
    required this.userId,
    required this.userRole,
    required this.publicationId,
    required this.text,
    this.parentId,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: (json['id'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      userRole: (json['userRole'] ?? '').toString(),
      publicationId: (json['publicationId'] ?? '').toString(),
      text: (json['text'] ?? '').toString(),
      parentId: json['parentId']?.toString(),
      createdAt: (json['createdAt'] ?? '').toString(),
    );
  }
}
