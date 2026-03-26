import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth/auth_service.dart';
import '../services/storage_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

// State for loading/error handling during auth actions
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
      error: error, // If not provided, error is cleared (or use logic to keep) - usually clear on new state
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthController(this._authService) : super(AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _authService.login(email, password);
      // Success
      state = state.copyWith(isLoading: false, isAuthenticated: true);
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
      // After register usually redirect to login, so authenticated is false still
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

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.watch(authServiceProvider));
});
