import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api_service.dart';
import '../storage_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

class AuthService {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();

  Future<void> saveClientType(String type) async {
    await _storageService.setClientType(type);
  }

  Future<String?> getClientType() async {
    return await _storageService.getClientType();
  }

  Future<void> clearClientType() async {
    await _storageService.clearClientType();
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final clientType = await _storageService.getClientType();
    if (clientType == null) {
      throw Exception('Client type not selected');
    }

    try {
      final response = await _apiService.post('/auth/login', data: {
        'email': email,
        'password': password,
        'client': clientType,
      });

      // Assuming response structure: { "access_token": "...", "refresh_token": "...", "user": {...} }
      final data = response.data;
      
      if (data['access_token'] != null && data['refresh_token'] != null) {
        await _storageService.saveTokens(
          accessToken: data['access_token'],
          refreshToken: data['refresh_token'],
        );
      }
      
      if (data['user'] != null) {
        await _storageService.saveUser(data['user']);
      }

      return data;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Credenciales inválidas');
      } else if (e.response?.statusCode == 403) {
        // Specific handling for 403 Forbidden (Client mismatch)
        final errorMsg = e.response?.data['error'] ?? 'Acceso denegado';
        throw Exception(errorMsg);
      } else if (e.response?.statusCode == 400) {
        throw Exception(e.response?.data['message'] ?? 'Error de solicitud');
      }
      rethrow;
    }
  }

  Future<void> register(String email, String password) async {
    final clientType = await _storageService.getClientType();
    if (clientType == null) {
      throw Exception('Client type not selected');
    }

    try {
      await _apiService.post('/auth/register', data: {
        'email': email,
        'password': password,
        'client': clientType,
      });
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        throw Exception('El usuario ya existe');
      } else if (e.response?.statusCode == 400) {
         final msg = e.response?.data['message'];
         if (msg is List) {
           throw Exception(msg.join('\n'));
         }
         throw Exception(msg ?? 'Error de validación');
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    await _storageService.clearSession();
  }
  
  Future<bool> isLoggedIn() async {
    final token = await _storageService.getAccessToken();
    return token != null;
  }
}
