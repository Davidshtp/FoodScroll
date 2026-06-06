import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../models/order_model.dart';
import '../../../services/order_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/futuristic_background.dart';

class OrdersListPage extends ConsumerStatefulWidget {
  const OrdersListPage({super.key});

  @override
  ConsumerState<OrdersListPage> createState() => _OrdersListPageState();
}

class _OrdersListPageState extends ConsumerState<OrdersListPage> {
  List<RestaurantOrder>? _allOrders;
  bool _isLoading = true;
  String _activeFilter = 'ALL';

  final _filters = [
    ('ALL', 'Todos'),
    ('PENDING', 'Pendientes'),
    ('CONFIRMED', 'Aceptados'),
    ('PREPARING', 'Preparación'),
    ('READY_FOR_PICKUP', 'Listos'),
    ('DELIVERED', 'Entregados'),
    ('CANCELLED', 'Cancelados'),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final service = ref.read(orderServiceProvider);
      final response = await service.fetchOrders();
      if (mounted) {
        setState(() { _allOrders = response.orders; _isLoading = false; });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<RestaurantOrder> get _filteredOrders {
    if (_allOrders == null) return [];
    if (_activeFilter == 'ALL') return _allOrders!;
    return _allOrders!
        .where((o) => o.status.toUpperCase() == _activeFilter)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return FuturisticBackground(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.m, AppSpacing.l, AppSpacing.m, AppSpacing.s,
                ),
                child: Text(
                  'Pedidos',
                  style: AppTypography.headlineMedium,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
                  children: _filters.map((f) {
                    final isActive = _activeFilter == f.$1;
                    return Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.s),
                      child: FilterChip(
                        label: Text(
                          f.$2,
                          style: AppTypography.labelLarge.copyWith(
                            fontSize: 13,
                            color: isActive ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                        selected: isActive,
                        onSelected: (_) => setState(() => _activeFilter = f.$1),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        checkmarkColor: Colors.white,
                        side: BorderSide(
                          color: isActive
                              ? AppColors.primary
                              : AppColors.border.withValues(alpha: 0.3),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.s)),
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                ),
              )
            else if (_filteredOrders.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.receipt_long_outlined,
                        size: 64,
                        color: AppColors.textTertiary.withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: AppSpacing.m),
                      Text(
                        'No hay pedidos',
                        style: AppTypography.titleMedium.copyWith(
                          color: AppColors.textTertiary.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.m, 0, AppSpacing.m, 96,
                ),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final order = _filteredOrders[index];
                      return _OrderCard(
                        order: order,
                        onTap: () => context.push(
                          '/restaurant/orders/${order.id}',
                          extra: order,
                        ),
                      );
                    },
                    childCount: _filteredOrders.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final RestaurantOrder order;
  final VoidCallback onTap;

  const _OrderCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = _statusColor;
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
                    Text(
                      '#${order.id.split('-').first}',
                      style: AppTypography.titleMedium,
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.s,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(AppRadius.s),
                      ),
                      child: Text(
                        order.statusLabel,
                        style: AppTypography.labelSmall.copyWith(
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s),
                ...order.orderItems.take(2).map((item) => Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.xs),
                  child: Row(
                    children: [
                      Text(
                        '${item.quantity}x ',
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          item.productName,
                          style: AppTypography.bodyMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                )),
                if (order.orderItems.length > 2)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.xs),
                    child: Text(
                      '+${order.orderItems.length - 2} más',
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ),
                const SizedBox(height: AppSpacing.s),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDate(order.createdAt),
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                    Text(
                      '\$${order.totalAmount.toStringAsFixed(0)}',
                      style: AppTypography.titleMedium.copyWith(
                        color: AppColors.accent,
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

  Color get _statusColor {
    switch (order.status.toUpperCase()) {
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
