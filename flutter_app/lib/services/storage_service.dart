import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

class StorageService {
  static const String _keyClientType = 'client_type';
  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUser = 'user_data';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // --- Client Type (Role) ---
  Future<void> setClientType(String type) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyClientType, type);
  }

  Future<String?> getClientType() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyClientType);
  }

  Future<void> clearClientType() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyClientType);
  }

  // --- Tokens ---
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    await _secureStorage.write(key: _keyAccessToken, value: accessToken);
    await _secureStorage.write(key: _keyRefreshToken, value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _keyRefreshToken);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: _keyAccessToken);
    await _secureStorage.delete(key: _keyRefreshToken);
  }

  // --- User Data ---
  Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(user));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(_keyUser);
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  Future<void> clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUser);
  }

  Future<void> clearSession() async {
    await clearTokens();
    await clearUser();
    // Do NOT clear client type on logout usually, but depends on requirements. 
    // Keeping client type allows quick login back into same role.
  }
}
