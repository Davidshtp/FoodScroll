import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import 'api_service.dart';

final codeServiceProvider = Provider<CodeService>((ref) {
  return CodeService();
});

class CodeServiceException implements Exception {
  final int? statusCode;
  final String message;

  CodeServiceException({this.statusCode, required this.message});

  factory CodeServiceException.fromApi(ApiException e) {
    return CodeServiceException(
      statusCode: e.statusCode,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class CodeService {
  final ApiService _apiService = ApiService();

  Future<void> requestConfirmEmail(String email) async {
    try {
      await _apiService.post(
        '/code/request-confirm-email',
        data: {'email': email},
      );
    } on ApiException catch (e) {
      throw CodeServiceException.fromApi(e);
    }
  }

  Future<void> verifyConfirmEmail(String email, String code) async {
    try {
      await _apiService.post(
        '/code/verify-confirm-email',
        data: {'email': email, 'code': code},
      );
    } on ApiException catch (e) {
      throw CodeServiceException.fromApi(e);
    }
  }
}
