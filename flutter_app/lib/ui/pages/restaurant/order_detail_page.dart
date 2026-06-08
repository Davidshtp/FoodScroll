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

import '../../components/futuristic_background.dart';
import '../../components/primary_button.dart';

class OrderDetailPage extends ConsumerStatefulWidget {
  final EnrichedOrder enrichedOrder;

  const OrderDetailPage({super.key, required this.enrichedOrder});

  @override
  ConsumerState<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends ConsumerState<OrderDetailPage> {
  late RestaurantOrder _order;
  EnrichedCustomerInfo? _customer;
  bool _isLoading = false;
  StreamSubscription<Map<String, dynamic>>? _wsSubscription;

  @override
  void initState() {
    super.initState();
    _order = widget.enrichedOrder.order;
    _customer = widget.enrichedOrder.customer;
    _setupWebSocket();
    ref.read(webSocketServiceProvider).joinOrderRoom(_order.id);
  }

  @override
  void dispose() {
    ref.read(webSocketServiceProvider).leaveOrderRoom(_order.id);
    _wsSubscription?.cancel();
    super.dispose();
  }

  void _setupWebSocket() {
    final ws = ref.read(webSocketServiceProvider);
    ws.connect();
    _wsSubscription = ws.orderStatusStream.listen((data) {
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

  Future<void> _confirmOrder() async {
    await _executeAction(
      action: () => ref.read(orderServiceProvider).confirmOrder(_order.id),
      successMsg: 'Pedido confirmado',
    );
  }

  Future<void> _rejectOrder() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Rechazar pedido'),
        content: const Text('¿Estás seguro de rechazar este pedido?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Rechazar', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    await _executeAction(
      action: () => ref.read(orderServiceProvider).rejectOrder(_order.id),
      successMsg: 'Pedido rechazado',
      isVoid: true,
    );
  }

  Future<void> _startPreparing() async {
    await _executeAction(
      action: () => ref.read(orderServiceProvider).startPreparing(_order.id),
      successMsg: 'Preparando pedido',
    );
  }

  Future<void> _markReady() async {
    await _executeAction(
      action: () => ref.read(orderServiceProvider).markReady(_order.id),
      successMsg: 'Pedido listo para recoger',
    );
  }

  Future<void> _executeAction({
    required Future<dynamic> Function() action,
    required String successMsg,
    bool isVoid = false,
  }) async {
    setState(() => _isLoading = true);
    try {
      if (isVoid) {
        await action();
        if (mounted) {
          setState(() => _order = RestaurantOrder(
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
          ));
        }
      } else {
        final result = await action();
        if (mounted && result is EnrichedOrder) {
          setState(() {
            _order = result.order;
            _customer = result.customer ?? _customer;
          });
        }
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMsg)),
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

  String get _customerName => _customer?.fullName.isNotEmpty == true
      ? _customer!.fullName
      : _order.customerId;

  @override
  Widget build(BuildContext context) {
    final status = _order.status.toUpperCase();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text(
          '#${_order.id.split('-').first}',
          style: AppTypography.titleLarge,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.m, AppSpacing.s, AppSpacing.m, 96,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _StatusBanner(status: _order.statusLabel, statusCode: status),
              const SizedBox(height: AppSpacing.l),
              Text(
                'DETALLE DEL PEDIDO',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.accent,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: AppSpacing.s),
              _InfoTile(
                label: 'Cliente',
                value: _customerName,
                isId: false,
              ),
              _InfoTile(
                label: 'Fecha',
                value: _formatDate(_order.createdAt),
              ),
              _InfoTile(
                label: 'Total',
                value: '\$${_order.totalAmount.toStringAsFixed(0)}',
                valueColor: AppColors.accent,
              ),
              const SizedBox(height: AppSpacing.l),
              Text(
                'PRODUCTOS',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.accent,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: AppSpacing.s),
              ..._order.orderItems.map((item) => _ProductCard(item: item)),
              const SizedBox(height: AppSpacing.xl),
              _buildActions(status),
          ],
        ),
      ),
      ),
        ],
      ),
    );
  }

  Widget _buildActions(String status) {
    final actions = <Widget>[];
    if (status == 'PENDING') {
      actions.addAll([
        PrimaryButton(
          label: 'Aceptar pedido',
          onPressed: _confirmOrder,
          isLoading: _isLoading,
        ),
        const SizedBox(height: AppSpacing.sm),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isLoading ? null : _rejectOrder,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(
              'Rechazar pedido',
              style: AppTypography.labelLarge.copyWith(
                color: AppColors.error,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ),
      ]);
    } else if (status == 'CONFIRMED') {
      actions.addAll([
        PrimaryButton(
          label: 'Empezar a preparar',
          onPressed: _startPreparing,
          isLoading: _isLoading,
        ),
        const SizedBox(height: AppSpacing.sm),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isLoading ? null : _rejectOrder,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text(
              'Rechazar pedido',
              style: AppTypography.labelLarge.copyWith(
                color: AppColors.error,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ),
      ]);
    } else if (status == 'PREPARING') {
      actions.addAll([
        PrimaryButton(
          label: 'Marcar como listo',
          onPressed: _markReady,
          isLoading: _isLoading,
        ),
      ]);
    } else if (status == 'READY_FOR_PICKUP') {
      actions.addAll([
        Container(
          padding: const EdgeInsets.all(AppSpacing.m),
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppRadius.m),
            border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle, color: AppColors.success, size: 24),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  'Pedido listo para recoger',
                  style: AppTypography.bodyLarge.copyWith(color: AppColors.success),
                ),
              ),
            ],
          ),
        ),
      ]);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: actions,
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

class _StatusBanner extends StatelessWidget {
  final String status;
  final String statusCode;

  const _StatusBanner({required this.status, required this.statusCode});

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
      child: Row(
        children: [
          Icon(_statusIcon, color: color, size: 24),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              status,
              style: AppTypography.titleMedium.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }

  Color get _statusColor {
    switch (statusCode) {
      case 'PENDING':
        return AppColors.warning;
      case 'CONFIRMED':
        return AppColors.info;
      case 'PREPARING':
        return AppColors.accent;
      case 'READY_FOR_PICKUP':
        return AppColors.success;
      case 'DELIVERED':
        return AppColors.textTertiary;
      case 'CANCELLED':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData get _statusIcon {
    switch (statusCode) {
      case 'PENDING':
        return Icons.hourglass_empty;
      case 'CONFIRMED':
        return Icons.check_circle_outline;
      case 'PREPARING':
        return Icons.restaurant;
      case 'READY_FOR_PICKUP':
        return Icons.inventory_2;
      case 'DELIVERED':
        return Icons.delivery_dining;
      case 'CANCELLED':
        return Icons.cancel_outlined;
      default:
        return Icons.receipt_long;
    }
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final bool isId;
  final Color? valueColor;

  const _InfoTile({
    required this.label,
    required this.value,
    this.isId = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 80,
              child: Text(
                label,
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.textTertiary,
                ),
              ),
            ),
            Expanded(
              child: Text(
                value,
                style: AppTypography.bodyLarge.copyWith(
                  color: valueColor ?? AppColors.textPrimary,
                  fontWeight: isId ? FontWeight.w400 : FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
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
          border: Border.all(
            color: AppColors.border.withValues(alpha: 0.2),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    item.productName,
                    style: AppTypography.bodyLarge.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '\$${item.totalPrice.toStringAsFixed(0)}',
                  style: AppTypography.titleMedium.copyWith(
                    color: AppColors.accent,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Text(
                  'Cant: ${item.quantity}',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
                const SizedBox(width: AppSpacing.m),
                Text(
                  '\$${item.unitPrice.toStringAsFixed(0)} c/u',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
            if (item.observation != null && item.observation!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Container(
                padding: const EdgeInsets.all(AppSpacing.s),
                decoration: BoxDecoration(
                  color: AppColors.surfaceHighlight.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(AppRadius.s),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.notes_rounded,
                      size: 14,
                      color: AppColors.textTertiary,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(
                        item.observation!,
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
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
