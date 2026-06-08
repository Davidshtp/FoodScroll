import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../models/order_model.dart';
import '../../../services/order_service.dart';
import '../../../services/websocket_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class OrdersListPage extends ConsumerStatefulWidget {
  const OrdersListPage({super.key});

  @override
  ConsumerState<OrdersListPage> createState() => _OrdersListPageState();
}

class _OrdersListPageState extends ConsumerState<OrdersListPage>
    with SingleTickerProviderStateMixin {
  List<EnrichedOrder>? _enrichedOrders;
  bool _isLoading = true;
  late TabController _tabController;
  StreamSubscription<Map<String, dynamic>>? _wsSubscription;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _load();
    _setupWebSocket();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) _load();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _wsSubscription?.cancel();
    _pollTimer?.cancel();
    super.dispose();
  }

  void _setupWebSocket() {
    final ws = ref.read(webSocketServiceProvider);
    ws.connect();
    _wsSubscription = ws.orderStatusStream.listen((data) {
      final eventData = data['data'] as Map<String, dynamic>? ?? data;
      final orderId = eventData['orderId']?.toString();
      final status = eventData['status']?.toString();
      if (orderId != null && status != null && mounted) {
        setState(() {
          _enrichedOrders = _enrichedOrders?.map((eo) {
            if (eo.order.id == orderId) {
              return EnrichedOrder(
                order: eo.order.copyWithStatus(status),
                restaurant: eo.restaurant,
                customer: eo.customer,
              );
            }
            return eo;
          }).toList();
        });
      }
    });
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final service = ref.read(orderServiceProvider);
      final response = await service.fetchOrders();
      if (mounted) {
        setState(() {
          _enrichedOrders = response.orders;
          _isLoading = false;
        });
        for (final eo in response.orders) {
          ref.read(webSocketServiceProvider).joinOrderRoom(eo.order.id);
        }
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<EnrichedOrder> _ordersByStatus(List<String> statuses) {
    if (_enrichedOrders == null) return [];
    return _enrichedOrders!
        .where((eo) => statuses.contains(eo.order.status.toUpperCase()))
        .toList();
  }

  Future<void> _confirmOrder(String orderId) async {
    try {
      final updated = await ref.read(orderServiceProvider).confirmOrder(orderId);
      if (mounted) {
        setState(() {
          _enrichedOrders = _enrichedOrders!.map((eo) => eo.order.id == orderId ? updated : eo).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido confirmado')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _rejectOrder(String orderId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Rechazar pedido'),
        content: const Text('¿Estás seguro de rechazar este pedido?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Rechazar', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(orderServiceProvider).rejectOrder(orderId);
      if (mounted) {
        setState(() {
          _enrichedOrders = _enrichedOrders!.map((eo) => eo.order.id == orderId
              ? EnrichedOrder(
                  order: RestaurantOrder(
                    id: eo.order.id, customerId: eo.order.customerId,
                    restaurantId: eo.order.restaurantId,
                    deliveryId: eo.order.deliveryId, customerAddressId: eo.order.customerAddressId,
                    status: 'CANCELLED', totalAmount: eo.order.totalAmount,
                    orderItems: eo.order.orderItems, createdAt: eo.order.createdAt,
                    updatedAt: DateTime.now().toIso8601String(),
                  ),
                  customer: eo.customer,
                  restaurant: eo.restaurant,
                )
              : eo).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido rechazado')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _startPreparing(String orderId) async {
    try {
      final updated = await ref.read(orderServiceProvider).startPreparing(orderId);
      if (mounted) {
        setState(() {
          _enrichedOrders = _enrichedOrders!.map((eo) => eo.order.id == orderId ? updated : eo).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Preparando pedido')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _markReady(String orderId) async {
    try {
      final updated = await ref.read(orderServiceProvider).markReady(orderId);
      if (mounted) {
        setState(() {
          _enrichedOrders = _enrichedOrders!.map((eo) => eo.order.id == orderId ? updated : eo).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido listo para recoger')),
        );
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
        title: Text('Pedidos', style: AppTypography.headlineMedium),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700),
          unselectedLabelStyle: AppTypography.labelLarge,
          tabs: const [
            Tab(text: 'Pendientes'),
            Tab(text: 'Preparación'),
            Tab(text: 'Listos'),
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
                  _buildSection(
                    orders: _ordersByStatus(['PENDING']),
                    emptyMsg: 'No hay pedidos pendientes',
                    section: 'pending',
                  ),
                  _buildSection(
                    orders: _ordersByStatus(['CONFIRMED', 'PREPARING']),
                    emptyMsg: 'No hay pedidos en preparación',
                    section: 'preparing',
                  ),
                  _buildSection(
                    orders: _ordersByStatus(['READY_FOR_PICKUP', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED']),
                    emptyMsg: 'No hay pedidos listos',
                    section: 'ready',
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required List<EnrichedOrder> orders,
    required String emptyMsg,
    required String section,
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
                  Icon(Icons.receipt_long_outlined, size: 64,
                      color: AppColors.textTertiary.withValues(alpha: 0.3)),
                  const SizedBox(height: AppSpacing.m),
                  Text(emptyMsg,
                      style: AppTypography.titleMedium.copyWith(
                          color: AppColors.textTertiary.withValues(alpha: 0.5))),
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
        return _OrderCard(
          enrichedOrder: enriched,
          section: section,
          onTap: () => context.push('/restaurant/orders/${order.id}', extra: enriched),
          onConfirm: section == 'pending' ? () => _confirmOrder(order.id) : null,
          onReject: section == 'pending' ? () => _rejectOrder(order.id) : null,
          onPrepare: order.status.toUpperCase() == 'CONFIRMED'
              ? () => _startPreparing(order.id)
              : null,
          onReady: order.status.toUpperCase() == 'PREPARING'
              ? () => _markReady(order.id)
              : null,
        );
      },
    );
  }
}

class _OrderCard extends StatelessWidget {
  final EnrichedOrder enrichedOrder;
  final String section;
  final VoidCallback onTap;
  final VoidCallback? onConfirm;
  final VoidCallback? onReject;
  final VoidCallback? onPrepare;
  final VoidCallback? onReady;

  const _OrderCard({
    required this.enrichedOrder,
    required this.section,
    required this.onTap,
    this.onConfirm,
    this.onReject,
    this.onPrepare,
    this.onReady,
  });

  RestaurantOrder get order => enrichedOrder.order;

  String get _customerDisplay => enrichedOrder.customer?.fullName.isNotEmpty == true
      ? enrichedOrder.customer!.fullName
      : order.customerId;

  Color get _statusColor {
    switch (order.status.toUpperCase()) {
      case 'PENDING': return AppColors.warning;
      case 'CONFIRMED': return AppColors.info;
      case 'PREPARING': return AppColors.accent;
      case 'READY_FOR_PICKUP': return AppColors.success;
      case 'ACCEPTED': return const Color(0xFF7C4DFF);
      case 'OUT_FOR_DELIVERY': return AppColors.info;
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
                      child: Text(order.statusLabel,
                          style: AppTypography.labelSmall.copyWith(color: _statusColor, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s),
                Row(
                  children: [
                    Icon(Icons.person, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(_customerDisplay,
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
                      Text('${item.quantity}x ',
                          style: AppTypography.bodyMedium.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                      Expanded(child: Text(item.productName,
                          style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                )),
                if (order.orderItems.length > 2)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.xs),
                    child: Text('+${order.orderItems.length - 2} más',
                        style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                  ),
                const SizedBox(height: AppSpacing.s),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_formatDate(order.createdAt),
                        style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                    Text('\$${order.totalAmount.toStringAsFixed(0)}',
                        style: AppTypography.titleMedium.copyWith(color: AppColors.accent)),
                  ],
                ),
                if (onConfirm != null || onReject != null || onPrepare != null || onReady != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  if (onConfirm != null || onReject != null)
                    Row(
                      children: [
                        if (onConfirm != null)
                          Expanded(
                            child: SizedBox(
                              height: 36,
                              child: ElevatedButton(
                                onPressed: onConfirm,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.success,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 13),
                                ),
                                child: const Text('Aceptar'),
                              ),
                            ),
                          ),
                        if (onConfirm != null && onReject != null)
                          const SizedBox(width: AppSpacing.s),
                        if (onReject != null)
                          Expanded(
                            child: SizedBox(
                              height: 36,
                              child: OutlinedButton(
                                onPressed: onReject,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.error,
                                  side: const BorderSide(color: AppColors.error),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 13),
                                ),
                                child: const Text('Rechazar'),
                              ),
                            ),
                          ),
                      ],
                    ),
                  if (onPrepare != null || onReady != null)
                    Row(
                      children: [
                        if (onPrepare != null)
                          Expanded(
                            child: SizedBox(
                              height: 36,
                              child: ElevatedButton(
                                onPressed: onPrepare,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accent,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 13),
                                ),
                                child: const Text('Preparar'),
                              ),
                            ),
                          ),
                        if (onReady != null)
                          Expanded(
                            child: SizedBox(
                              height: 36,
                              child: ElevatedButton(
                                onPressed: onReady,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.success,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 13),
                                ),
                                child: const Text('Listo'),
                              ),
                            ),
                          ),
                      ],
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
      return '${dt.day.toString().padLeft(2, '0')}/'
          '${dt.month.toString().padLeft(2, '0')}/'
          '${dt.year} ${dt.hour.toString().padLeft(2, '0')}:'
          '${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}
