import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/delivery_order_model.dart';
import '../../../services/order_service.dart';
import '../../../services/websocket_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class DeliveryOrderDetailPage extends ConsumerStatefulWidget {
  final DeliveryOrder deliveryOrder;

  const DeliveryOrderDetailPage({super.key, required this.deliveryOrder});

  @override
  ConsumerState<DeliveryOrderDetailPage> createState() => _DeliveryOrderDetailPageState();
}

class _DeliveryOrderDetailPageState extends ConsumerState<DeliveryOrderDetailPage> {
  late DeliveryOrder _delivery;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _delivery = widget.deliveryOrder;
    _setupWebSocket();
  }

  void _setupWebSocket() {
    final ws = ref.read(webSocketServiceProvider);
    ws.connect();
    ws.orderStatusStream.listen((data) {
      final orderId = data['data']?['orderId']?.toString() ?? data['orderId']?.toString();
      if (orderId == _delivery.order.id) {
        final status = data['data']?['status']?.toString() ?? data['status']?.toString();
        if (status != null && mounted) {
          setState(() {
            _delivery = DeliveryOrder(
              order: _delivery.order.copyWithStatus(status),
              restaurant: _delivery.restaurant,
              deliveryAddress: _delivery.deliveryAddress,
              customer: _delivery.customer,
            );
          });
        }
      }
    });
  }

  Future<void> _pickup() async {
    setState(() => _isLoading = true);
    try {
      final result = await ref.read(orderServiceProvider).pickupOrder(_delivery.order.id);
      if (mounted) {
        setState(() {
          _delivery = result;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pedido recogido, en camino')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  Future<void> _deliver() async {
    setState(() => _isLoading = true);
    try {
      final result = await ref.read(orderServiceProvider).deliverOrder(_delivery.order.id);
      if (mounted) {
        setState(() {
          _delivery = result;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pedido entregado exitosamente')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  Color get _statusColor {
    switch (_delivery.order.status.toUpperCase()) {
      case 'READY_FOR_PICKUP': return AppColors.success;
      case 'ACCEPTED': return AppColors.info;
      case 'OUT_FOR_DELIVERY': return AppColors.accent;
      case 'DELIVERED': return AppColors.textTertiary;
      case 'CANCELLED': return AppColors.error;
      default: return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _delivery.order;
    final rest = _delivery.restaurant;
    final customer = _delivery.customer;
    final deliveryAddr = _delivery.deliveryAddress;
    final status = order.status.toUpperCase();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text('#${order.id.split('-').first}', style: AppTypography.titleLarge),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 96),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _StatusBanner(label: _statusLabel, color: _statusColor),
                const SizedBox(height: AppSpacing.l),

                if (customer != null) ...[
                  Text('CLIENTE', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
                  const SizedBox(height: AppSpacing.s),
                  _InfoTile(
                    label: 'Nombre',
                    value: customer.fullName,
                    leading: customer.avatarUrl != null && customer.avatarUrl!.isNotEmpty
                        ? ClipOval(
                            child: SizedBox(
                              width: 32, height: 32,
                              child: CachedNetworkImage(imageUrl: customer.avatarUrl!, fit: BoxFit.cover,
                                placeholder: (_, _) => Container(color: AppColors.surfaceHighlight),
                                errorWidget: (_, _, _) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.person, color: AppColors.textSecondary, size: 18))),
                            ),
                          )
                        : null,
                  ),
                  _InfoTile(label: 'Teléfono', value: customer.phone),
                  const SizedBox(height: AppSpacing.l),
                ],

                Text('DIRECCIÓN DE ENTREGA', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
                const SizedBox(height: AppSpacing.s),
                if (deliveryAddr != null)
                  _InfoTile(
                    label: 'Dirección',
                    value: deliveryAddr.displayAddress,
                    leading: const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                  )
                else
                  _InfoTile(label: 'Dirección', value: 'No disponible'),
                const SizedBox(height: AppSpacing.l),

                if (rest?.address != null) ...[
                  Text('RESTAURANTE', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
                  const SizedBox(height: AppSpacing.s),
                  _InfoTile(label: 'Dirección', value: rest!.address!.displayAddress, leading: const Icon(Icons.restaurant, color: AppColors.textSecondary, size: 20)),
                  const SizedBox(height: AppSpacing.l),
                ],

                Text('DETALLE DEL PEDIDO', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
                const SizedBox(height: AppSpacing.s),
                _InfoTile(label: 'Total', value: '\$${order.totalAmount.toStringAsFixed(0)}', valueColor: AppColors.accent),
                const SizedBox(height: AppSpacing.l),

                Text('PRODUCTOS', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
                const SizedBox(height: AppSpacing.s),
                ...order.orderItems.map((item) => _ProductCard(item: item)),
              ],
            ),
          ),
          if (status == 'READY_FOR_PICKUP' || status == 'ACCEPTED')
            Positioned(
              left: AppSpacing.m,
              right: AppSpacing.m,
              bottom: 24,
              child: SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _pickup,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Recogí el pedido'),
                ),
              ),
            ),
          if (status == 'OUT_FOR_DELIVERY')
            Positioned(
              left: AppSpacing.m,
              right: AppSpacing.m,
              bottom: 24,
              child: SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _deliver,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Entregado'),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String get _statusLabel {
    switch (_delivery.order.status.toUpperCase()) {
      case 'READY_FOR_PICKUP': return 'Listo para recoger';
      case 'ACCEPTED': return 'Aceptado';
      case 'OUT_FOR_DELIVERY': return 'En camino';
      case 'DELIVERED': return 'Entregado';
      case 'CANCELLED': return 'Cancelado';
      default: return _delivery.order.status;
    }
  }
}

class _StatusBanner extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusBanner({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.m),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(_statusIcon, color: color, size: 24),
          const SizedBox(width: AppSpacing.sm),
          Text(label, style: AppTypography.titleMedium.copyWith(color: color)),
        ],
      ),
    );
  }

  IconData get _statusIcon {
    switch (label.toUpperCase()) {
      case 'READY_FOR_PICKUP': return Icons.inventory_2;
      case 'ACCEPTED': return Icons.check_circle_outline;
      case 'OUT_FOR_DELIVERY': return Icons.delivery_dining;
      case 'ENTREGADO': return Icons.check_circle;
      case 'CANCELADO': return Icons.cancel_outlined;
      default: return Icons.receipt_long;
    }
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final Widget? leading;
  final Color? valueColor;

  const _InfoTile({required this.label, required this.value, this.leading, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            if (leading != null) ...[leading!, const SizedBox(width: AppSpacing.sm)],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                  const SizedBox(height: 2),
                  Text(value, style: AppTypography.bodyLarge.copyWith(color: valueColor ?? AppColors.textPrimary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final dynamic item;
  const _ProductCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
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
            const SizedBox(height: 4),
            Row(
              children: [
                Text('Cant: ${item.quantity}', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
                const SizedBox(width: AppSpacing.m),
                Text('\$${item.unitPrice.toStringAsFixed(0)} c/u', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
              ],
            ),
            if (item.observation != null && item.observation!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppColors.surfaceHighlight.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(8)),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.notes_rounded, size: 14, color: AppColors.textTertiary),
                    const SizedBox(width: 6),
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
