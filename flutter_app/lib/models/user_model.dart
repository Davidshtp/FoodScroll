class AuthUser {
  final String id;
  final String email;
  final String role;
  final String? appStatus;
  final String? client;

  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    this.appStatus,
    this.client,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: (json['id'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      appStatus: json['appStatus']?.toString(),
      client: json['client']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role,
      if (appStatus != null) 'appStatus': appStatus,
      if (client != null) 'client': client,
    };
  }

  String? get normalizedAppStatus => appStatus?.toUpperCase();
}

class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final AuthUser user;
  final String? welcome;

  const LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    this.welcome,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: (json['access_token'] ?? '').toString(),
      refreshToken: (json['refresh_token'] ?? '').toString(),
      user: AuthUser.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? const {},
      ),
      welcome: json['welcome']?.toString(),
    );
  }
}

class RegisterResponse {
  final String message;
  final AuthUser user;

  const RegisterResponse({
    required this.message,
    required this.user,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    return RegisterResponse(
      message: (json['message'] ?? '').toString(),
      user: AuthUser.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

class RefreshTokenResponse {
  final String accessToken;
  final String refreshToken;
  final AuthUser user;

  const RefreshTokenResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory RefreshTokenResponse.fromJson(Map<String, dynamic> json) {
    return RefreshTokenResponse(
      accessToken: (json['access_token'] ?? '').toString(),
      refreshToken: (json['refresh_token'] ?? '').toString(),
      user: AuthUser.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}
