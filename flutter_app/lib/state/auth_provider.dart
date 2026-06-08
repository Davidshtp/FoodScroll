import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../services/auth/auth_service.dart';
import '../services/storage_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class AuthState {
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthController(this._authService) : super(AuthState());

  Future<void> loginWithGoogle(String idToken) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _authService.loginWithGoogle(idToken);
      state = state.copyWith(isLoading: false, isAuthenticated: true);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.displayMessage);
      rethrow;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _authService.login(email, password);
      state = state.copyWith(isLoading: false, isAuthenticated: true);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.displayMessage);
      rethrow;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> register(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _authService.register(email, password);
      state = state.copyWith(isLoading: false);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.displayMessage);
      rethrow;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = state.copyWith(isAuthenticated: false);
  }

  Future<void> checkAuthStatus() async {
    final isLoggedIn = await _authService.isLoggedIn();
    state = state.copyWith(isAuthenticated: isLoggedIn);
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.watch(authServiceProvider));
});
