import '../../core/api_exception.dart';
import '../../models/user_model.dart';
import '../api_service.dart';
import '../storage_service.dart';

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

  Future<LoginResponse> login(String email, String password) async {
    final clientType = await _storageService.getClientType();
    if (clientType == null) {
      throw ApiException(
        error: '',
        message: 'Selecciona un tipo de cuenta antes de iniciar sesión',
      );
    }

    final response = await _apiService.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
        'client': clientType,
      },
      sendAuth: false,
    );

    final loginResponse = LoginResponse.fromJson(
      (response.data as Map<String, dynamic>?) ?? const {},
    );

    await _persistSession(loginResponse);
    return loginResponse;
  }

  Future<RegisterResponse> register(String email, String password) async {
    final clientType = await _storageService.getClientType();
    if (clientType == null) {
      throw ApiException(
        error: '',
        message: 'Selecciona un tipo de cuenta antes de registrarte',
      );
    }

    try {
      final response = await _apiService.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'client': clientType,
        },
        sendAuth: false,
      );

      return RegisterResponse.fromJson(
        (response.data as Map<String, dynamic>?) ?? const {},
      );
    } on ApiException catch (e) {
      if (e.statusCode == 409) {
        throw ApiException(
          statusCode: 409,
          error: e.error.isNotEmpty ? e.error : 'El usuario ya existe',
          message: e.message,
        );
      }
      rethrow;
    }
  }

  Future<RefreshTokenResponse> refreshSession() async {
    final refreshToken = await _storageService.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw ApiException(
        statusCode: 401,
        error: 'Refresh token inválido',
        message: 'Sesión expirada',
      );
    }

    final accessToken = await _storageService.getAccessToken();
    final response = await _apiService.post(
      '/auth/refresh',
      data: {'refresh_token': refreshToken},
      headers: {
        if (accessToken != null && accessToken.isNotEmpty)
          'Authorization': 'Bearer $accessToken',
      },
    );

    final refreshResponse = RefreshTokenResponse.fromJson(
      (response.data as Map<String, dynamic>?) ?? const {},
    );

    await _storageService.saveTokens(
      accessToken: refreshResponse.accessToken,
      refreshToken: refreshResponse.refreshToken,
    );
    await _storageService.saveUser(refreshResponse.user.toJson());

    return refreshResponse;
  }

  Future<bool> logout() async {
    try {
      await _apiService.post('/auth/logout');
    } on ApiException catch (e) {
      if (e.statusCode != 401) {
        rethrow;
      }
    } finally {
      await _storageService.clearSession();
    }
    return true;
  }

  Future<AuthUser> fetchMe() async {
    final response = await _apiService.get('/auth/me');
    final user = AuthUser.fromJson(
      (response.data as Map<String, dynamic>?) ?? const {},
    );
    await _storageService.saveUser(user.toJson());
    return user;
  }

  Future<void> _persistSession(LoginResponse loginResponse) async {
    await _storageService.saveTokens(
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
    );
    await _storageService.saveUser(loginResponse.user.toJson());
  }

  Future<bool> isLoggedIn() async {
    final token = await _storageService.getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
