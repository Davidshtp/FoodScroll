import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../models/delivery_order_model.dart';
import '../../../services/order_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class DeliveryHistoryPage extends ConsumerStatefulWidget {
  const DeliveryHistoryPage({super.key});

  @override
  ConsumerState<DeliveryHistoryPage> createState() => _DeliveryHistoryPageState();
}

class _DeliveryHistoryPageState extends ConsumerState<DeliveryHistoryPage> {
  List<DeliveryOrder> _orders = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _page = 1;
  bool _isLoadingMore = false;
  static const int _limit = 20;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() { _isLoading = true; _page = 1; _hasMore = true; });
    try {
      final response = await ref.read(orderServiceProvider).fetchDeliveryHistory(page: _page, limit: _limit);
        if (mounted) {
          setState(() {
            _orders = response.orders;
            _hasMore = response.orders.length >= _limit;
            _isLoading = false;
          });
        }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;
    setState(() => _isLoadingMore = true);
    _page++;
    try {
      final response = await ref.read(orderServiceProvider).fetchDeliveryHistory(page: _page, limit: _limit);
      if (mounted) {
        setState(() {
          _orders.addAll(response.orders);
          _hasMore = response.orders.length >= _limit;
          _isLoadingMore = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text('Historial de entregas', style: AppTypography.headlineMedium),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
          : _orders.isEmpty
              ? ListView(children: [
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.5,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.3)),
                          const SizedBox(height: AppSpacing.m),
                          Text('Sin entregas completadas', style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary.withValues(alpha: 0.5))),
                        ],
                      ),
                    ),
                  ),
                ])
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _loadHistory,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 96),
                    itemCount: _orders.length + (_hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= _orders.length) {
                        _loadMore();
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                        );
                      }
                      final delivery = _orders[index];
                      final order = delivery.order;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: Material(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () async {
                              await context.push('/delivery/orders/${order.id}', extra: delivery);
                              if (mounted) _loadHistory();
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(AppSpacing.m),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('#${order.id.split('-').first}', style: AppTypography.titleMedium),
                                      Text('\$${order.totalAmount.toStringAsFixed(0)}', style: AppTypography.titleMedium.copyWith(color: AppColors.accent)),
                                    ],
                                  ),
                                  const SizedBox(height: AppSpacing.s),
                                  Row(
                                    children: [
                                      Icon(Icons.restaurant, size: 14, color: AppColors.textSecondary),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(delivery.restaurant?.name ?? 'Restaurante',
                                            style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                                            maxLines: 1, overflow: TextOverflow.ellipsis),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: AppSpacing.s),
                                  Row(
                                    children: [
                                      Icon(Icons.check_circle, size: 14, color: AppColors.success),
                                      const SizedBox(width: 6),
                                      Text('Entregado', style: AppTypography.bodyMedium.copyWith(color: AppColors.success)),
                                      const Spacer(),
                                      Text(_formatDate(order.updatedAt), style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
