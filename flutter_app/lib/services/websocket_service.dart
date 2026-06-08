import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../services/storage_service.dart';

class WebSocketService {
  io.Socket? _socket;
  bool _isConnected = false;
  final _orderStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _deliveryLocationController = StreamController<Map<String, dynamic>>.broadcast();
  final StorageService _storage = StorageService();

  Stream<Map<String, dynamic>> get orderStatusStream => _orderStatusController.stream;
  Stream<Map<String, dynamic>> get deliveryLocationStream => _deliveryLocationController.stream;
  bool get isConnected => _isConnected;

  Future<void> connect() async {
    if (_socket != null && _isConnected) return;

    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return;

    _socket = io.io(
      'http://localhost:3000?token=$token',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableReconnection()
          .build(),
    );

    _socket!.onConnect((_) {
      _isConnected = true;
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
    });

    _socket!.on('order.status.updated', (data) {
      if (data is Map<String, dynamic>) {
        _orderStatusController.add(data);
      }
    });

    _socket!.on('delivery.location.updated', (data) {
      if (data is Map<String, dynamic>) {
        _deliveryLocationController.add(data);
      }
    });

    _socket!.onError((err) {
      _isConnected = false;
    });

    _socket!.connect();
  }

  void joinOrderRoom(String orderId) {
    _socket?.emit('joinOrderRoom', {'orderId': orderId});
  }

  void leaveOrderRoom(String orderId) {
    _socket?.emit('leaveOrderRoom', {'orderId': orderId});
  }

  void emit(String event, Map<String, dynamic> data) {
    _socket?.emit(event, data);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }

  void dispose() {
    disconnect();
    _orderStatusController.close();
    _deliveryLocationController.close();
  }
}

final webSocketServiceProvider = Provider<WebSocketService>((ref) {
  final service = WebSocketService();
  ref.onDispose(() => service.dispose());
  return service;
});
