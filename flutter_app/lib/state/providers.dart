import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

// Service Provider
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

// Example Repository Provider
// final authRepositoryProvider = Provider<AuthRepository>((ref) {
//   return AuthRepository(ref.watch(apiServiceProvider));
// });
