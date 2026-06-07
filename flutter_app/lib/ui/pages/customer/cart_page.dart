import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../services/order_service.dart';
import '../../../state/cart_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class CartPage extends ConsumerWidget {
  const CartPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(cartProvider);
    final total = ref.watch(cartProvider.notifier).total;

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.3)),
            const SizedBox(height: AppSpacing.m),
            Text('Carrito vacío', style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary)),
            const SizedBox(height: AppSpacing.s),
            Text('Agrega productos del feed', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
          ],
        ),
      );
    }

    final grouped = ref.read(cartProvider.notifier).itemsByRestaurant;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('CARRITO', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
          const SizedBox(height: AppSpacing.s),
          Text('${ref.read(cartProvider.notifier).itemCount} productos', style: AppTypography.titleMedium),
          const SizedBox(height: AppSpacing.m),
          for (final entry in grouped.entries) ...[
            _RestaurantCartSection(
              restaurantName: entry.value.first.restaurantName,
              items: entry.value,
            ),
            const SizedBox(height: AppSpacing.m),
          ],
          Container(
            padding: const EdgeInsets.all(AppSpacing.m),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.m),
              border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total', style: AppTypography.titleLarge),
                Text('\$${total.toStringAsFixed(0)}', style: AppTypography.headlineMedium.copyWith(color: AppColors.accent)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.l),
        ],
      ),
    );
  }
}

class _RestaurantCartSection extends ConsumerWidget {
  final String restaurantName;
  final List<CartItem> items;

  const _RestaurantCartSection({required this.restaurantName, required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.sm, AppSpacing.m, AppSpacing.s),
            child: Text(restaurantName, style: AppTypography.titleMedium.copyWith(color: AppColors.accent)),
          ),
          const Divider(height: 1, color: AppColors.divider),
          ...items.map((item) => _CartItemCard(item: item)),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.m),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _checkout(context, ref, items),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(
                  'Ordenar en $restaurantName',
                  style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w800, letterSpacing: 1.2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _checkout(BuildContext context, WidgetRef ref, List<CartItem> items) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Confirmar pedido'),
        content: Text('¿Enviar pedido a $restaurantName por \$${items.fold(0.0, (s, i) => s + i.totalPrice).toStringAsFixed(0)}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ordenar', style: TextStyle(color: AppColors.primary))),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(orderServiceProvider).createOrder(
        restaurantId: items.first.restaurantId,
        items: items.map((i) => i.toOrderItem()).toList(),
      );
      for (final item in items) {
        ref.read(cartProvider.notifier).removeItem(item.publicationId);
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido realizado con éxito')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }
}

class _CartItemCard extends ConsumerWidget {
  final CartItem item;

  const _CartItemCard({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, AppSpacing.s),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.s),
            child: SizedBox(
              width: 48, height: 48,
              child: item.imageUrl != null
                  ? CachedNetworkImage(imageUrl: item.imageUrl!, fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: AppColors.surfaceHighlight),
                      errorWidget: (context, url, error) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.image, color: AppColors.textTertiary, size: 24)))
                  : Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.image, color: AppColors.textTertiary, size: 24)),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title, style: AppTypography.bodyLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('\$${item.price.toStringAsFixed(0)}', style: AppTypography.bodyMedium.copyWith(color: AppColors.accent)),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTap: () => ref.read(cartProvider.notifier).updateQuantity(item.publicationId, item.quantity - 1),
                child: Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(color: AppColors.surfaceHighlight, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.remove, size: 16, color: AppColors.textPrimary),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s),
                child: Text('${item.quantity}', style: AppTypography.bodyLarge),
              ),
              GestureDetector(
                onTap: () => ref.read(cartProvider.notifier).updateQuantity(item.publicationId, item.quantity + 1),
                child: Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.add, size: 16, color: Colors.white),
                ),
              ),
              const SizedBox(width: AppSpacing.s),
              GestureDetector(
                onTap: () => ref.read(cartProvider.notifier).removeItem(item.publicationId),
                child: const Icon(Icons.delete_outline, size: 20, color: AppColors.error),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
