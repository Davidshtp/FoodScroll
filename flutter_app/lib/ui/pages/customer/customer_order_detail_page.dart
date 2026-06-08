import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../models/order_model.dart';
import '../../../models/address_model.dart';
import '../../../services/order_service.dart';
import '../../../services/restaurant_service.dart';
import '../../../services/address_service.dart';
import '../../../services/websocket_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class CustomerOrderDetailPage extends ConsumerStatefulWidget {
  final EnrichedOrder enrichedOrder;

  const CustomerOrderDetailPage({super.key, required this.enrichedOrder});

  @override
  ConsumerState<CustomerOrderDetailPage> createState() => _CustomerOrderDetailPageState();
}

class _CustomerOrderDetailPageState extends ConsumerState<CustomerOrderDetailPage> {
  late RestaurantOrder _order;
  EnrichedRestaurantInfo? _restaurant;
  bool _isLoading = false;
  StreamSubscription<Map<String, dynamic>>? _wsSub;
  StreamSubscription<Map<String, dynamic>>? _locationSub;
  LatLng? _deliveryPosition;
  CustomerAddress? _customerAddress;

  @override
  void initState() {
    super.initState();
    _order = widget.enrichedOrder.order;
    _restaurant = widget.enrichedOrder.restaurant;
    _setupWebSocket();
    _setupLocationListener();
    ref.read(webSocketServiceProvider).joinOrderRoom(_order.id);
    _fetchCustomerAddress();
    if (_restaurant == null) {
      _enrichRestaurant();
    }
  }

  @override
  void dispose() {
    ref.read(webSocketServiceProvider).leaveOrderRoom(_order.id);
    _wsSub?.cancel();
    _locationSub?.cancel();
    super.dispose();
  }

  Future<void> _fetchCustomerAddress() async {
    try {
      final addresses = await ref.read(addressServiceProvider).fetchAddresses();
      if (mounted) {
        final match = addresses.where((a) => a.id == _order.customerAddressId).firstOrNull;
        setState(() => _customerAddress = match ?? addresses.firstOrNull);
      }
    } catch (_) {}
  }

  Future<void> _enrichRestaurant() async {
    try {
      final restaurantService = ref.read(restaurantServiceProvider);
      final profile = await restaurantService.fetchPublicProfile(_order.restaurantId);
      if (mounted) {
        setState(() {
          _restaurant = EnrichedRestaurantInfo(
            id: profile.id,
            name: profile.name,
            logoUrl: profile.logoUrl ?? '',
          );
        });
      }
    } catch (_) {}
  }

  void _setupLocationListener() {
    final ws = ref.read(webSocketServiceProvider);
    _locationSub = ws.deliveryLocationStream.listen((data) {
      final eventData = data['data'] as Map<String, dynamic>? ?? data;
      final orderId = eventData['orderId']?.toString() ?? '';
      if (orderId == _order.id && mounted) {
        final lat = eventData['lat'];
        final lng = eventData['lng'];
        if (lat != null && lng != null) {
          setState(() {
            _deliveryPosition = LatLng((lat as num).toDouble(), (lng as num).toDouble());
          });
        }
      }
    });
  }

  void _setupWebSocket() {
    final ws = ref.read(webSocketServiceProvider);
    ws.connect();
    _wsSub = ws.orderStatusStream.listen((data) {
      final eventData = data['data'] as Map<String, dynamic>? ?? data;
      final orderId = eventData['orderId']?.toString();
      if (orderId == _order.id) {
        final status = eventData['status']?.toString();
        if (status != null && mounted) {
          setState(() => _order = _order.copyWithStatus(status));
        }
      }
    });
  }

  Widget _buildTrackingMap() {
    final markers = <Marker>[];
    LatLng? customerPoint;
    if (_customerAddress != null && (_customerAddress!.latitude ?? 0) != 0) {
      customerPoint = LatLng(_customerAddress!.latitude!, _customerAddress!.longitude!);
      markers.add(Marker(
        point: customerPoint,
        width: 36, height: 36,
        child: Container(
          decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
          child: const Icon(Icons.home, color: Colors.white, size: 18),
        ),
      ));
    }
    if (_deliveryPosition != null) {
      markers.add(Marker(
        point: _deliveryPosition!,
        width: 48, height: 48,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.delivery_dining, color: AppColors.primary, size: 28),
        ),
      ));
    }
    final center = customerPoint ?? _deliveryPosition ?? const LatLng(4.7110, -74.0721);
    return Container(
      height: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      clipBehavior: Clip.antiAlias,
      child: FlutterMap(
        options: MapOptions(
          initialCenter: center,
          initialZoom: 15.0,
          interactionOptions: const InteractionOptions(flags: ~InteractiveFlag.doubleTapZoom),
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.foodscroll.app',
          ),
          MarkerLayer(markers: markers),
        ],
      ),
    );
  }

  bool get _canCancel => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].contains(_order.status.toUpperCase());

  Future<void> _cancelOrder() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Cancelar pedido'),
        content: const Text('¿Estás seguro de cancelar este pedido?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sí, cancelar', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(orderServiceProvider).cancelOrder(_order.id);
      if (mounted) {
        setState(() {
          _order = RestaurantOrder(
            id: _order.id,
            customerId: _order.customerId,
            restaurantId: _order.restaurantId,
            deliveryId: _order.deliveryId,
            customerAddressId: _order.customerAddressId,
            status: 'CANCELLED',
            totalAmount: _order.totalAmount,
            orderItems: _order.orderItems,
            createdAt: _order.createdAt,
            updatedAt: DateTime.now().toIso8601String(),
          );
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido cancelado')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String get _restaurantName => _restaurant?.name ?? _order.restaurantId;

  @override
  Widget build(BuildContext context) {
    final status = _order.status.toUpperCase();
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text('#${_order.id.split('-').first}', style: AppTypography.titleLarge),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 96),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _StatusTimeline(status: _order.statusLabel, statusCode: status),
            const SizedBox(height: AppSpacing.l),
            if (status == 'OUT_FOR_DELIVERY') ...[
              Text('UBICACIÓN DEL REPARTIDOR', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
              const SizedBox(height: AppSpacing.s),
              _buildTrackingMap(),
              const SizedBox(height: AppSpacing.l),
            ],
            Text('DETALLE DEL PEDIDO', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
            const SizedBox(height: AppSpacing.s),
            _InfoTile(label: 'Restaurante', value: _restaurantName, isId: false),
            _InfoTile(label: 'Fecha', value: _formatDate(_order.createdAt)),
            _InfoTile(label: 'Total', value: '\$${_order.totalAmount.toStringAsFixed(0)}', valueColor: AppColors.accent),
            const SizedBox(height: AppSpacing.l),
            Text('PRODUCTOS', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
            const SizedBox(height: AppSpacing.s),
            ..._order.orderItems.map((item) => _ProductCard(item: item)),
            if (_canCancel) ...[
              const SizedBox(height: AppSpacing.xl),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _cancelOrder,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text('Cancelar pedido', style: AppTypography.labelLarge.copyWith(color: AppColors.error, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
                ),
              ),
            ],
          ],
        ),
      ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _StatusTimeline extends StatelessWidget {
  final String status;
  final String statusCode;

  const _StatusTimeline({required this.status, required this.statusCode});

  @override
  Widget build(BuildContext context) {
    final color = _statusColor;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(_statusIcon, color: color, size: 24),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(status, style: AppTypography.titleMedium.copyWith(color: color)),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          _buildStep('Pedido recibido', statusCode, ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED']),
          _buildStep('Restaurante confirmó', statusCode, ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED']),
          _buildStep('En preparación', statusCode, ['PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED']),
          _buildStep('Listo para recoger', statusCode, ['READY_FOR_PICKUP', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED']),
          _buildStep('En camino', statusCode, ['ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED']),
          _buildStep('Entregado', statusCode, ['DELIVERED']),
        ],
      ),
    );
  }

  Widget _buildStep(String label, String currentStatus, List<String> activeStatuses) {
    final isActive = activeStatuses.contains(currentStatus) && currentStatus != 'CANCELLED';
    final isCancelled = currentStatus == 'CANCELLED';
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: Row(
        children: [
          Icon(
            isCancelled ? Icons.cancel : (isActive ? Icons.check_circle : Icons.radio_button_unchecked),
            size: 16,
            color: isCancelled ? AppColors.error : (isActive ? AppColors.success : AppColors.textTertiary),
          ),
          const SizedBox(width: AppSpacing.s),
          Text(label, style: AppTypography.bodyMedium.copyWith(
            color: isCancelled ? AppColors.error : (isActive ? AppColors.textPrimary : AppColors.textTertiary),
          )),
        ],
      ),
    );
  }

  Color get _statusColor {
    switch (statusCode) {
      case 'PENDING': return AppColors.warning;
      case 'CONFIRMED': return AppColors.info;
      case 'PREPARING': return AppColors.accent;
      case 'READY_FOR_PICKUP': return AppColors.success;
      case 'DELIVERED': return AppColors.textTertiary;
      case 'CANCELLED': return AppColors.error;
      default: return AppColors.textSecondary;
    }
  }

  IconData get _statusIcon {
    switch (statusCode) {
      case 'PENDING': return Icons.hourglass_empty;
      case 'CONFIRMED': return Icons.check_circle_outline;
      case 'PREPARING': return Icons.restaurant;
      case 'READY_FOR_PICKUP': return Icons.inventory_2;
      case 'DELIVERED': return Icons.delivery_dining;
      case 'CANCELLED': return Icons.cancel_outlined;
      default: return Icons.receipt_long;
    }
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final bool isId;
  final Color? valueColor;

  const _InfoTile({required this.label, required this.value, this.isId = false, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(AppRadius.m)),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 80, child: Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary))),
            Expanded(
              child: Text(value, style: AppTypography.bodyLarge.copyWith(
                color: valueColor ?? AppColors.textPrimary,
                fontWeight: isId ? FontWeight.w400 : FontWeight.w600,
              ), maxLines: 2, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final OrderItem item;

  const _ProductCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(item.productName, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis)),
                Text('\$${item.totalPrice.toStringAsFixed(0)}', style: AppTypography.titleMedium.copyWith(color: AppColors.accent)),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Text('Cant: ${item.quantity}', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
                const SizedBox(width: AppSpacing.m),
                Text('\$${item.unitPrice.toStringAsFixed(0)} c/u', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
              ],
            ),
            if (item.observation != null && item.observation!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Container(
                padding: const EdgeInsets.all(AppSpacing.s),
                decoration: BoxDecoration(color: AppColors.surfaceHighlight.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(AppRadius.s)),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.notes_rounded, size: 14, color: AppColors.textTertiary),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(child: Text(item.observation!, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, fontSize: 13, fontStyle: FontStyle.italic))),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
