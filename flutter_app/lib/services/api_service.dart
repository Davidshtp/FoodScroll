import 'package:dio/dio.dart';
import '../core/api_exception.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  final Dio _dio;
  final StorageService _storage = StorageService();
  bool _isRefreshing = false;

  ApiService._internal()
      : _dio = Dio(
          BaseOptions(
            baseUrl: 'http://localhost:3000/api',
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
            headers: {
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _onRequest,
        onError: _onError,
      ),
    );
  }

  bool _requiresAuth(String path, String method) {
    final normalized = path.startsWith('/') ? path : '/$path';

    if (normalized.startsWith('/auth/register')) {
      return false;
    }
    if (normalized.startsWith('/auth/login')) {
      return false;
    }
    if (normalized.startsWith('/location/department')) {
      return false;
    }
    if (normalized.startsWith('/location/city/by-department')) {
      return false;
    }
    if (RegExp(r'^/location/city/[^/]+$').hasMatch(normalized) &&
        !normalized.contains('by-department')) {
      return false;
    }
    if (normalized.startsWith('/code/request-reset-code') ||
        normalized.startsWith('/code/verify-reset-code')) {
      return false;
    }

    return true;
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.data is FormData) {
      options.contentType = null;
      options.headers.remove('Content-Type');
    }
    final path = options.path;
    if (_requiresAuth(path, options.method)) {
      final token = await _storage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final status = err.response?.statusCode;
    final path = err.requestOptions.path;
    final isRefreshCall = path.contains('/auth/refresh');
    final isAuthCall =
        path.contains('/auth/login') || path.contains('/auth/register');

    if (status == 401 &&
        !isRefreshCall &&
        !isAuthCall &&
        err.requestOptions.extra['retried'] != true) {
      try {
        await _refreshTokens();
        final token = await _storage.getAccessToken();
        final requestOptions = err.requestOptions;
        requestOptions.headers['Authorization'] = 'Bearer $token';
        requestOptions.extra['retried'] = true;
        final response = await _dio.fetch(requestOptions);
        return handler.resolve(response);
      } catch (_) {
        await _storage.clearSession();
      }
    }

    handler.next(err);
  }

  Future<void> _refreshTokens() async {
    if (_isRefreshing) {
      return;
    }
    _isRefreshing = true;
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        throw ApiException(
          statusCode: 401,
          error: 'Refresh token inválido',
          message: 'Sesión expirada',
        );
      }

      final accessToken = await _storage.getAccessToken();
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
        options: Options(
          headers: {
            if (accessToken != null && accessToken.isNotEmpty)
              'Authorization': 'Bearer $accessToken',
          },
          extra: {'skipAuthInterceptor': true},
        ),
      );

      final data = response.data;
      if (data is Map<String, dynamic>) {
        final access = data['access_token']?.toString();
        final refresh = data['refresh_token']?.toString();
        if (access != null &&
            access.isNotEmpty &&
            refresh != null &&
            refresh.isNotEmpty) {
          await _storage.saveTokens(
            accessToken: access,
            refreshToken: refresh,
          );
        }
        final user = data['user'];
        if (user is Map<String, dynamic>) {
          await _storage.saveUser(user);
        }
      }
    } finally {
      _isRefreshing = false;
    }
  }

  StorageService getStorage() => _storage;

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? headers,
    bool sendAuth = true,
  }) async {
    return _request(
      () => _dio.put(
        path,
        data: data,
        options: _buildOptions(headers, sendAuth: sendAuth),
      ),
    );
  }

  Future<Response> postMultipart({
    required String path,
    required FormData formData,
    Map<String, dynamic>? headers,
  }) async {
    final mergedHeaders = <String, dynamic>{
      'Accept': 'application/json',
      if (headers != null) ...headers,
    };
    return _request(
      () => _dio.post(
        path,
        data: formData,
        options: Options(
          headers: mergedHeaders,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 120),
          sendTimeout: const Duration(seconds: 60),
        ),
      ),
    );
  }

  Future<Response> patchMultipart({
    required String path,
    required FormData formData,
    Map<String, dynamic>? headers,
  }) async {
    final mergedHeaders = <String, dynamic>{
      'Accept': 'application/json',
      if (headers != null) ...headers,
    };
    return _request(
      () => _dio.patch(
        path,
        data: formData,
        options: Options(
          headers: mergedHeaders,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 120),
          sendTimeout: const Duration(seconds: 60),
        ),
      ),
    );
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Map<String, dynamic>? headers,
    bool sendAuth = true,
  }) async {
    return _request(
      () => _dio.get(
        path,
        queryParameters: queryParameters,
        options: _buildOptions(headers, sendAuth: sendAuth),
      ),
    );
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? headers,
    bool sendAuth = true,
  }) async {
    return _request(
      () => _dio.post(
        path,
        data: data,
        options: _buildOptions(headers, sendAuth: sendAuth),
      ),
    );
  }

  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? headers,
    bool sendAuth = true,
  }) async {
    return _request(
      () => _dio.patch(
        path,
        data: data,
        options: _buildOptions(headers, sendAuth: sendAuth),
      ),
    );
  }

  Future<Response> delete(
    String path, {
    Map<String, dynamic>? headers,
    bool sendAuth = true,
  }) async {
    return _request(
      () => _dio.delete(
        path,
        options: _buildOptions(headers, sendAuth: sendAuth),
      ),
    );
  }

  Options? _buildOptions(
    Map<String, dynamic>? headers, {
    required bool sendAuth,
  }) {
    if (headers == null && sendAuth) {
      return null;
    }
    return Options(
      headers: headers,
      extra: sendAuth ? null : {'skipAuth': true},
    );
  }

  Future<Response> _request(Future<Response> Function() call) async {
    try {
      return await call();
    } on DioException catch (e) {
      throw ApiException.fromDio(
        statusCode: e.response?.statusCode,
        data: e.response?.data,
      );
    }
  }
}
