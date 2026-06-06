import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../models/publication_model.dart';
import '../../../models/order_model.dart';
import '../../../services/publication_service.dart';
import '../../../services/order_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../../theme/app_shadows.dart';
import '../../components/futuristic_background.dart';

class RestaurantHomePage extends ConsumerStatefulWidget {
  const RestaurantHomePage({super.key});

  @override
  ConsumerState<RestaurantHomePage> createState() => _RestaurantHomePageState();
}

class _RestaurantHomePageState extends ConsumerState<RestaurantHomePage> {
  List<RestaurantPublication>? _publications;
  List<RestaurantOrder>? _orders;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final pubService = ref.read(publicationServiceProvider);
      final orderService = ref.read(orderServiceProvider);
      final pubs = await pubService.fetchPublications();
      final ordersResp = await orderService.fetchOrders();
      if (mounted) {
        setState(() {
          _publications = pubs;
          _orders = ordersResp.orders;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FuturisticBackground(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.m, AppSpacing.l, AppSpacing.m, 96,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Panel de control',
                style: AppTypography.headlineMedium,
              ),
              const SizedBox(height: AppSpacing.xl),
              _QuickActionCard(
                icon: Icons.menu_book,
                title: 'Mis Publicaciones',
                subtitle: 'Gestiona tus publicaciones activas',
                onTap: () => context.push('/restaurant/publications'),
              ),
              const SizedBox(height: AppSpacing.m),
              _QuickActionCard(
                icon: Icons.add_circle_outline,
                title: 'Crear Publicación',
                subtitle: 'Añade un nuevo producto o promoción',
                gradient: true,
                onTap: () => context.push('/restaurant/publications/create'),
              ),
              const SizedBox(height: AppSpacing.m),
              _QuickActionCard(
                icon: Icons.receipt_long,
                title: 'Pedidos',
                subtitle: 'Revisa y gestiona los pedidos entrantes',
                onTap: () => context.push('/restaurant/orders'),
              ),
              const SizedBox(height: AppSpacing.xl),
              if (_isLoading && _publications == null)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.l),
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.primary,
                    ),
                  ),
                )
              else ...[
                if (_publications != null && _publications!.isNotEmpty) ...[
                  Text(
                    'ÚLTIMAS PUBLICACIONES',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.accent,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s),
                  ...(_publications!.take(3).map((pub) => _PublicationMiniCard(
                    publication: pub,
                    onTap: () => context.push(
                      '/restaurant/publications/edit',
                      extra: pub,
                    ),
                  ))),
                ],
                if (_orders != null && _orders!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.m),
                  Text(
                    'PEDIDOS RECIENTES',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.accent,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s),
                  ...(_orders!.take(3).map((order) => _OrderMiniCard(
                    order: order,
                    onTap: () => context.push(
                      '/restaurant/orders/${order.id}',
                      extra: order,
                    ),
                  ))),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool gradient;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.gradient = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.m),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            gradient: gradient
                ? const LinearGradient(
                    colors: [Color(0xFFFF3B30), Color(0xFFFF8C69)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: gradient ? null : AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.m),
            border: gradient ? null : Border.all(
              color: AppColors.border.withValues(alpha: 0.3),
            ),
            boxShadow: gradient ? AppShadows.glow : AppShadows.card,
          ),
          padding: const EdgeInsets.all(AppSpacing.m),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: gradient
                      ? Colors.white.withValues(alpha: 0.2)
                      : AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppRadius.l),
                ),
                child: Icon(
                  icon,
                  color: gradient ? Colors.white : AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: AppSpacing.m),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTypography.titleMedium.copyWith(
                        color: gradient ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTypography.bodyMedium.copyWith(
                        color: gradient
                            ? Colors.white.withValues(alpha: 0.8)
                            : AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: gradient ? Colors.white : AppColors.textTertiary,
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PublicationMiniCard extends StatelessWidget {
  final RestaurantPublication publication;
  final VoidCallback onTap;

  const _PublicationMiniCard({
    required this.publication,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.m),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.s),
                  child: Container(
                    width: 52,
                    height: 52,
                    color: AppColors.surfaceHighlight,
                    child: publication.imageUrls.isNotEmpty
                        ? null
                        : const Icon(
                            Icons.image_outlined,
                            color: AppColors.textTertiary,
                            size: 24,
                          ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        publication.title,
                        style: AppTypography.bodyLarge,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (publication.price != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          '\$${publication.price!.toStringAsFixed(0)}',
                          style: AppTypography.bodyMedium.copyWith(
                            color: AppColors.accent,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Text(
                  publication.type ?? 'General',
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OrderMiniCard extends StatelessWidget {
  final RestaurantOrder order;
  final VoidCallback onTap;

  const _OrderMiniCard({
    required this.order,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.m),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(AppRadius.s),
                  ),
                  child: Icon(
                    Icons.receipt,
                    color: _statusColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '#${order.id.split('-').first}',
                        style: AppTypography.bodyLarge,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '\$${order.totalAmount.toStringAsFixed(0)}',
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.accent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(AppRadius.s),
                  ),
                  child: Text(
                    order.statusLabel,
                    style: AppTypography.labelSmall.copyWith(
                      color: _statusColor,
                      fontSize: 11,
                    ),
                  ),
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
}
