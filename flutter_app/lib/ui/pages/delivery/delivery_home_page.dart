import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../models/delivery_order_model.dart';
import '../../../services/order_service.dart';
import '../../../services/websocket_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class DeliveryHomePage extends ConsumerStatefulWidget {
  const DeliveryHomePage({super.key});

  @override
  ConsumerState<DeliveryHomePage> createState() => _DeliveryHomePageState();
}

class _DeliveryHomePageState extends ConsumerState<DeliveryHomePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<DeliveryOrder> _available = [];
  List<DeliveryOrder> _active = [];
  bool _isLoadingAvailable = true;
  bool _isLoadingActive = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAvailable();
    _loadActive();
    _setupWebSocket();
  }

  StreamSubscription<Map<String, dynamic>>? _wsSub;

  void _setupWebSocket() {
    final ws = ref.read(webSocketServiceProvider);
    _wsSub = ws.orderStatusStream.listen((data) {
      if (!mounted) return;
      final updatedId = data['orderId']?.toString() ?? data['id']?.toString() ?? '';
      final newStatus = data['status']?.toString() ?? '';
      if (updatedId.isEmpty || newStatus.isEmpty) return;
      setState(() {
        for (int i = 0; i < _available.length; i++) {
          if (_available[i].order.id == updatedId) {
            _available[i] = _available[i].copyWithOrderStatus(newStatus);
          }
        }
        for (int i = 0; i < _active.length; i++) {
          if (_active[i].order.id == updatedId) {
            _active[i] = _active[i].copyWithOrderStatus(newStatus);
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _wsSub?.cancel();
    super.dispose();
  }

  Future<void> _loadAvailable() async {
    setState(() => _isLoadingAvailable = true);
    try {
      final response = await ref.read(orderServiceProvider).fetchAvailableOrders();
      if (mounted) setState(() { _available = response.orders; _isLoadingAvailable = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoadingAvailable = false);
    }
  }

  Future<void> _loadActive() async {
    setState(() => _isLoadingActive = true);
    try {
      final response = await ref.read(orderServiceProvider).fetchMyDeliveries();
      if (mounted) setState(() { _active = response.orders; _isLoadingActive = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoadingActive = false);
    }
  }

  Future<void> _acceptOrder(String orderId) async {
    try {
      await ref.read(orderServiceProvider).acceptOrder(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pedido aceptado')));
        _loadAvailable();
        _loadActive();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text('Entregas', style: AppTypography.headlineMedium),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700),
          unselectedLabelStyle: AppTypography.labelLarge,
          tabs: const [
            Tab(text: 'Disponibles'),
            Tab(text: 'Mis entregas'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAvailableTab(),
          _buildActiveTab(),
        ],
      ),
    );
  }

  Widget _buildAvailableTab() {
    if (_isLoadingAvailable) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary));
    }
    if (_available.isEmpty) {
      return ListView(
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inventory_2_outlined, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.3)),
                  const SizedBox(height: AppSpacing.m),
                  Text('No hay pedidos disponibles', style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary.withValues(alpha: 0.5))),
                ],
              ),
            ),
          ),
        ],
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadAvailable,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 96),
        itemCount: _available.length,
        itemBuilder: (context, index) {
          final order = _available[index].order;
          final rest = _available[index].restaurant;
          return _OrderCard(
            orderId: order.id,
            restaurantName: rest?.name ?? 'Restaurante',
            restaurantAddress: rest?.address?.displayAddress ?? '',
            total: order.totalAmount,
            items: order.orderItems,
            status: order.status,
            onTap: () async {
              await context.push('/delivery/orders/${order.id}', extra: _available[index]);
              if (mounted) { _loadAvailable(); _loadActive(); }
            },
            onAccept: () => _acceptOrder(order.id),
          );
        },
      ),
    );
  }

  Widget _buildActiveTab() {
    if (_isLoadingActive) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary));
    }
    if (_active.isEmpty) {
      return ListView(
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.two_wheeler_outlined, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.3)),
                  const SizedBox(height: AppSpacing.m),
                  Text('No tienes entregas activas', style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary.withValues(alpha: 0.5))),
                ],
              ),
            ),
          ),
        ],
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadActive,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 96),
        itemCount: _active.length,
        itemBuilder: (context, index) {
          final delivery = _active[index];
          final order = delivery.order;
          return _OrderCard(
            orderId: order.id,
            restaurantName: delivery.restaurant?.address?.displayAddress ?? 'Restaurante',
            restaurantAddress: '',
            total: order.totalAmount,
            items: order.orderItems,
            status: order.status,
            onTap: () async {
              await context.push('/delivery/orders/${order.id}', extra: delivery);
              if (mounted) { _loadActive(); _loadAvailable(); }
            },
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final String orderId;
  final String restaurantName;
  final String restaurantAddress;
  final double total;
  final List<dynamic> items;
  final String status;
  final VoidCallback onTap;
  final VoidCallback? onAccept;

  const _OrderCard({
    required this.orderId,
    required this.restaurantName,
    required this.restaurantAddress,
    required this.total,
    required this.items,
    required this.status,
    required this.onTap,
    this.onAccept,
  });

  Color get _statusColor {
    switch (status.toUpperCase()) {
      case 'READY_FOR_PICKUP': return AppColors.success;
      case 'ACCEPTED': return AppColors.info;
      case 'OUT_FOR_DELIVERY': return AppColors.accent;
      case 'DELIVERED': return AppColors.textTertiary;
      case 'CANCELLED': return AppColors.error;
      default: return AppColors.warning;
    }
  }

  String get _statusLabel {
    switch (status.toUpperCase()) {
      case 'READY_FOR_PICKUP': return 'Listo para recoger';
      case 'ACCEPTED': return 'Aceptado';
      case 'OUT_FOR_DELIVERY': return 'En camino';
      case 'DELIVERED': return 'Entregado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.m),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('#${orderId.split('-').first}', style: AppTypography.titleMedium),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(_statusLabel, style: AppTypography.labelSmall.copyWith(color: _statusColor, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s),
                Row(
                  children: [
                    Icon(Icons.restaurant, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(restaurantName,
                          style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
                if (restaurantAddress.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 14, color: AppColors.textTertiary),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(restaurantAddress,
                            style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary, fontSize: 12),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: AppSpacing.s),
                ...items.take(2).map((item) => Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Row(
                    children: [
                      Text('${item.quantity}x ', style: AppTypography.bodyMedium.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                      Expanded(child: Text(item.productName, style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                )),
                if (items.length > 2)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('+${items.length - 2} más', style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                  ),
                const SizedBox(height: AppSpacing.s),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('\$${total.toStringAsFixed(0)}', style: AppTypography.titleMedium.copyWith(color: AppColors.accent)),
                    if (onAccept != null)
                      SizedBox(
                        height: 32,
                        child: ElevatedButton(
                          onPressed: onAccept,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 12),
                          ),
                          child: const Text('Aceptar'),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
