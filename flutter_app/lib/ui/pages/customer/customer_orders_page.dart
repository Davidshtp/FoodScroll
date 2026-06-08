import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../models/order_model.dart';
import '../../../services/order_service.dart';
import '../../../services/websocket_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class CustomerOrdersPage extends ConsumerStatefulWidget {
  const CustomerOrdersPage({super.key});

  @override
  ConsumerState<CustomerOrdersPage> createState() => _CustomerOrdersPageState();
}

class _CustomerOrdersPageState extends ConsumerState<CustomerOrdersPage>
    with SingleTickerProviderStateMixin {
  List<EnrichedOrder>? _enrichedOrders;
  bool _isLoading = true;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
    _setupWebSocket();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _setupWebSocket() {
    final ws = ref.read(webSocketServiceProvider);
    ws.connect();
    ws.orderStatusStream.listen((data) {
      if (mounted) _load();
    });
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final response = await ref.read(orderServiceProvider).fetchMyOrders();
      if (mounted) {
        setState(() {
          _enrichedOrders = response.orders;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<EnrichedOrder> _activeOrders() {
    if (_enrichedOrders == null) return [];
    return _enrichedOrders!
        .where((eo) => !['DELIVERED', 'CANCELLED'].contains(eo.order.status.toUpperCase()))
        .toList();
  }

  List<EnrichedOrder> _historyOrders() {
    if (_enrichedOrders == null) return [];
    return _enrichedOrders!
        .where((eo) => ['DELIVERED', 'CANCELLED'].contains(eo.order.status.toUpperCase()))
        .toList();
  }

  Future<void> _cancelOrder(String orderId) async {
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

    try {
      await ref.read(orderServiceProvider).cancelOrder(orderId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido cancelado')),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Mis Pedidos', style: AppTypography.headlineMedium),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700),
          unselectedLabelStyle: AppTypography.labelLarge,
          tabs: const [
            Tab(text: 'Activos'),
            Tab(text: 'Historial'),
          ],
        ),
      ),
      body: Stack(
        children: [
          _isLoading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _load,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildSection(orders: _activeOrders(), emptyMsg: 'No hay pedidos activos', showCancel: true),
                  _buildSection(orders: _historyOrders(), emptyMsg: 'No hay historial de pedidos', showCancel: false),
                ],
              ),
            ),
          Positioned(
            top: 4,
            right: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text('A4', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required List<EnrichedOrder> orders,
    required String emptyMsg,
    required bool showCancel,
  }) {
    if (orders.isEmpty) {
      return ListView(
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.4,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_outlined, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.3)),
                  const SizedBox(height: AppSpacing.m),
                  Text(emptyMsg, style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary.withValues(alpha: 0.5))),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 96),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final enriched = orders[index];
        final order = enriched.order;
        final cancellable = showCancel && ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].contains(order.status.toUpperCase());
        return _CustomerOrderCard(
          enrichedOrder: enriched,
          onTap: () => context.push('/customer/orders/${order.id}', extra: enriched),
          onCancel: cancellable ? () => _cancelOrder(order.id) : null,
        );
      },
    );
  }
}

class _CustomerOrderCard extends StatelessWidget {
  final EnrichedOrder enrichedOrder;
  final VoidCallback onTap;
  final VoidCallback? onCancel;

  const _CustomerOrderCard({required this.enrichedOrder, required this.onTap, this.onCancel});

  RestaurantOrder get order => enrichedOrder.order;

  String get _restaurantDisplay => enrichedOrder.restaurant?.name ?? order.restaurantId;

  Color get _statusColor {
    switch (order.status.toUpperCase()) {
      case 'PENDING': return AppColors.warning;
      case 'CONFIRMED': return AppColors.info;
      case 'PREPARING': return AppColors.accent;
      case 'READY_FOR_PICKUP': return AppColors.success;
      case 'DELIVERED': return AppColors.textTertiary;
      case 'CANCELLED': return AppColors.error;
      default: return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.m),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.m),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('#${order.id.split('-').first}', style: AppTypography.titleMedium),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s, vertical: AppSpacing.xs),
                      decoration: BoxDecoration(
                        color: _statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(AppRadius.s),
                      ),
                      child: Text(order.statusLabel, style: AppTypography.labelSmall.copyWith(color: _statusColor, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s),
                Row(
                  children: [
                    Icon(Icons.restaurant, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(_restaurantDisplay,
                          style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s),
                ...order.orderItems.take(2).map((item) => Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.xs),
                  child: Row(
                    children: [
                      Text('${item.quantity}x ', style: AppTypography.bodyMedium.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                      Expanded(child: Text(item.productName, style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                )),
                if (order.orderItems.length > 2)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.xs),
                    child: Text('+${order.orderItems.length - 2} más', style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                  ),
                const SizedBox(height: AppSpacing.s),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_formatDate(order.createdAt), style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                    Text('\$${order.totalAmount.toStringAsFixed(0)}', style: AppTypography.titleMedium.copyWith(color: AppColors.accent)),
                  ],
                ),
                if (onCancel != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  SizedBox(
                    height: 32,
                    child: OutlinedButton(
                      onPressed: onCancel,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
                        textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                      child: const Text('Cancelar pedido'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
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
