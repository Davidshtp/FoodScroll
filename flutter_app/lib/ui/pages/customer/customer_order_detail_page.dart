import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../models/order_model.dart';
import '../../../services/order_service.dart';
import '../../../services/websocket_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class CustomerOrderDetailPage extends ConsumerStatefulWidget {
  final RestaurantOrder order;

  const CustomerOrderDetailPage({super.key, required this.order});

  @override
  ConsumerState<CustomerOrderDetailPage> createState() => _CustomerOrderDetailPageState();
}

class _CustomerOrderDetailPageState extends ConsumerState<CustomerOrderDetailPage> {
  late RestaurantOrder _order;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
    _setupWebSocket();
  }

  void _setupWebSocket() {
    final ws = ref.read(webSocketServiceProvider);
    ws.connect();
    ws.orderStatusStream.listen((data) {
      final orderId = data['orderId']?.toString() ?? data['id']?.toString();
      if (orderId == _order.id) {
        final status = data['status']?.toString();
        final updatedAt = data['updatedAt']?.toString() ?? DateTime.now().toIso8601String();
        if (status != null) {
          if (mounted) {
            setState(() {
              _order = RestaurantOrder(
                id: _order.id,
                customerId: _order.customerId,
                restaurantId: _order.restaurantId,
                deliveryId: _order.deliveryId,
                customerAddressId: _order.customerAddressId,
                status: status,
                totalAmount: _order.totalAmount,
                orderItems: _order.orderItems,
                createdAt: _order.createdAt,
                updatedAt: updatedAt,
              );
            });
          }
        }
      }
    });
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 96),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _StatusTimeline(status: _order.statusLabel, statusCode: status),
            const SizedBox(height: AppSpacing.l),
            Text('DETALLE DEL PEDIDO', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
            const SizedBox(height: AppSpacing.s),
            _InfoTile(label: 'Restaurante', value: _order.restaurantId, isId: true),
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
