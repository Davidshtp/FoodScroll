import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_exception.dart';
import '../models/address_model.dart';
import 'api_service.dart';

final addressServiceProvider = Provider<AddressService>((ref) {
  return AddressService();
});

class AddressServiceException implements Exception {
  final int? statusCode;
  final String message;

  AddressServiceException({this.statusCode, required this.message});

  factory AddressServiceException.fromApi(ApiException e) {
    return AddressServiceException(
      statusCode: e.statusCode,
      message: e.displayMessage,
    );
  }

  @override
  String toString() => message;
}

class AddressService {
  final ApiService _apiService = ApiService();

  Future<CustomerAddress> createAddress(AddressPayload payload) async {
    try {
      final response = await _apiService.post(
        '/customer/address',
        data: payload.toJson(),
      );

      return CustomerAddress.fromJson(
        (response.data as Map<String, dynamic>?) ?? const {},
      );
    } on ApiException catch (e) {
      throw AddressServiceException.fromApi(e);
    }
  }

  Future<List<CustomerAddress>> fetchAddresses() async {
    try {
      final response = await _apiService.get('/customer/address');
      final data = response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map(CustomerAddress.fromJson)
            .toList();
      }
      return [];
    } on ApiException catch (e) {
      throw AddressServiceException.fromApi(e);
    }
  }

  Future<CustomerAddress> updateAddress(
    String addressId,
    AddressUpdatePayload payload,
  ) async {
    try {
      final response = await _apiService.patch(
        '/customer/address/$addressId',
        data: payload.toJson(),
      );

      return CustomerAddress.fromJson(
        (response.data as Map<String, dynamic>?) ?? const {},
      );
    } on ApiException catch (e) {
      throw AddressServiceException.fromApi(e);
    }
  }

  Future<void> deleteAddress(String addressId) async {
    try {
      await _apiService.delete('/customer/address/$addressId');
    } on ApiException catch (e) {
      throw AddressServiceException.fromApi(e);
    }
  }
}

class AddressUpdatePayload {
  final String? alias;
  final String? neighborhood;
  final String? details;

  AddressUpdatePayload({
    this.alias,
    this.neighborhood,
    this.details,
  });

  Map<String, dynamic> toJson() {
    return {
      if (alias != null) 'alias': alias,
      if (neighborhood != null) 'neighborhood': neighborhood,
      if (details != null) 'details': details,
    };
  }
}
