import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../../models/delivery_order_model.dart';
import '../../../services/order_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_typography.dart';

class DeliveryMapPage extends ConsumerStatefulWidget {
  const DeliveryMapPage({super.key});

  @override
  ConsumerState<DeliveryMapPage> createState() => _DeliveryMapPageState();
}

class _DeliveryMapPageState extends ConsumerState<DeliveryMapPage> {
  List<DeliveryOrder> _activeDeliveries = [];
  bool _isLoading = true;
  LatLng? _myPosition;

  @override
  void initState() {
    super.initState();
    _loadActiveDeliveries();
    _getMyPosition();
  }

  Future<void> _getMyPosition() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) return;
    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (mounted) setState(() => _myPosition = LatLng(pos.latitude, pos.longitude));
    } catch (_) {}
  }

  Future<void> _loadActiveDeliveries() async {
    setState(() => _isLoading = true);
    try {
      final response = await ref.read(orderServiceProvider).fetchMyDeliveries();
      if (mounted) setState(() { _activeDeliveries = response.orders; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text('Mapa de entregas', style: AppTypography.headlineMedium),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimary),
            onPressed: _loadActiveDeliveries,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
          : _buildMap(),
    );
  }

  Widget _buildMap() {
    final markers = <Marker>[];

    if (_myPosition != null) {
      markers.add(Marker(
        point: _myPosition!,
        width: 40, height: 40,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.my_location, color: AppColors.primary, size: 24),
        ),
      ));
    }

    for (final delivery in _activeDeliveries) {
      final restAddr = delivery.restaurant?.address;
      final deliveryAddr = delivery.deliveryAddress;

      if (restAddr != null && (restAddr.latitude != 0 || restAddr.longitude != 0)) {
        markers.add(Marker(
          point: LatLng(restAddr.latitude, restAddr.longitude),
          width: 36, height: 36,
          child: GestureDetector(
            onTap: () => context.push('/delivery/orders/${delivery.order.id}', extra: delivery),
            child: Container(
              decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
              child: const Icon(Icons.restaurant, color: Colors.white, size: 18),
            ),
          ),
        ));
      }

      if (deliveryAddr != null && (deliveryAddr.latitude != 0 || deliveryAddr.longitude != 0)) {
        markers.add(Marker(
          point: LatLng(deliveryAddr.latitude, deliveryAddr.longitude),
          width: 36, height: 36,
          child: GestureDetector(
            onTap: () => context.push('/delivery/orders/${delivery.order.id}', extra: delivery),
            child: Container(
              decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: const Icon(Icons.location_on, color: Colors.white, size: 18),
            ),
          ),
        ));
      }
    }

    LatLng center;
    if (_myPosition != null) {
      center = _myPosition!;
    } else if (_activeDeliveries.isNotEmpty) {
      final first = _activeDeliveries.first;
      final addr = first.deliveryAddress ?? first.restaurant?.address;
      if (addr != null && (addr.latitude != 0 || addr.longitude != 0)) {
        center = LatLng(addr.latitude, addr.longitude);
      } else {
        center = const LatLng(4.7110, -74.0721);
      }
    } else {
      center = const LatLng(4.7110, -74.0721);
    }

    return FlutterMap(
      options: MapOptions(initialCenter: center, initialZoom: 12.0),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.foodscroll.app',
        ),
        MarkerLayer(markers: markers),
      ],
    );
  }
}
