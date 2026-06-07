import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../models/feed_publication_model.dart';
import '../../../services/feed_service.dart';
import '../../../services/engagement_service.dart';
import '../../../state/cart_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class FeedPage extends ConsumerStatefulWidget {
  final double? latitude;
  final double? longitude;

  const FeedPage({super.key, this.latitude, this.longitude});

  @override
  ConsumerState<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends ConsumerState<FeedPage> {
  List<FeedPublication>? _publications;
  bool _isLoading = true;

  final Map<String, bool> _likedMap = {};
  final Map<String, int> _likeCountMap = {};
  final Map<String, bool> _followedMap = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final response = await ref.read(feedServiceProvider).fetchFeed(
        latitude: widget.latitude,
        longitude: widget.longitude,
      );
      if (mounted) {
        setState(() {
          _publications = response.publications;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleLike(String publicationId) async {
    final service = ref.read(engagementServiceProvider);
    final currentLiked = _likedMap[publicationId] ?? false;
    final currentCount = _likeCountMap[publicationId] ?? 0;

    setState(() {
      _likedMap[publicationId] = !currentLiked;
      _likeCountMap[publicationId] = currentLiked ? currentCount - 1 : currentCount + 1;
    });

    try {
      final result = await service.toggleLike(publicationId);
      if (mounted) {
        setState(() {
          _likedMap[publicationId] = result.liked;
          _likeCountMap[publicationId] = result.count;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _likedMap[publicationId] = currentLiked;
          _likeCountMap[publicationId] = currentCount;
        });
      }
    }
  }

  Future<void> _toggleFollow(String restaurantId) async {
    final service = ref.read(engagementServiceProvider);
    final currentFollowed = _followedMap[restaurantId] ?? false;

    setState(() {
      _followedMap[restaurantId] = !currentFollowed;
    });

    try {
      if (currentFollowed) {
        await service.unfollowRestaurant(restaurantId);
      } else {
        await service.followRestaurant(restaurantId);
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _followedMap[restaurantId] = currentFollowed;
        });
      }
    }
  }

  void _addToCart(FeedPublication pub) {
    ref.read(cartProvider.notifier).addItem(CartItem(
      publicationId: pub.id,
      restaurantId: pub.restaurantId,
      restaurantName: pub.restaurantName,
      title: pub.title,
      imageUrl: pub.imageUrls.isNotEmpty ? pub.imageUrls.first : null,
      price: pub.price ?? 0,
    ));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${pub.title} añadido al carrito'), duration: const Duration(seconds: 2)),
    );
  }

  void _orderNow(FeedPublication pub) {
    ref.read(cartProvider.notifier).addItem(CartItem(
      publicationId: pub.id,
      restaurantId: pub.restaurantId,
      restaurantName: pub.restaurantName,
      title: pub.title,
      imageUrl: pub.imageUrls.isNotEmpty ? pub.imageUrls.first : null,
      price: pub.price ?? 0,
    ));
    context.push('/cart');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary));
    }

    if (_publications == null || _publications!.isEmpty) {
      return _buildEmpty();
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 96),
        itemCount: _publications!.length,
        itemBuilder: (context, index) {
          final pub = _publications![index];
          return _FeedCard(
            publication: pub,
            isLiked: _likedMap[pub.id] ?? false,
            likeCount: _likeCountMap[pub.id] ?? 0,
            isFollowed: _followedMap[pub.restaurantId] ?? false,
            onLike: () => _toggleLike(pub.id),
            onFollow: () => _toggleFollow(pub.restaurantId),
            onAddToCart: () => _addToCart(pub),
            onOrderNow: () => _orderNow(pub),
            onRestaurantTap: () => context.push(
              '/restaurant-public-profile/${pub.restaurantId}',
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.rss_feed_outlined, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.3)),
          const SizedBox(height: AppSpacing.m),
          Text('No hay publicaciones', style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary)),
          const SizedBox(height: AppSpacing.s),
          Text('Sigue restaurantes para ver sus publicaciones', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
        ],
      ),
    );
  }
}

class _FeedCard extends StatelessWidget {
  final FeedPublication publication;
  final bool isLiked;
  final int likeCount;
  final bool isFollowed;
  final VoidCallback onLike;
  final VoidCallback onFollow;
  final VoidCallback onAddToCart;
  final VoidCallback onOrderNow;
  final VoidCallback onRestaurantTap;

  const _FeedCard({
    required this.publication,
    required this.isLiked,
    required this.likeCount,
    required this.isFollowed,
    required this.onLike,
    required this.onFollow,
    required this.onAddToCart,
    required this.onOrderNow,
    required this.onRestaurantTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.s, AppSpacing.m, AppSpacing.s),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _RestaurantHeader(
            restaurantName: publication.restaurantName,
            restaurantLogo: publication.restaurantLogo,
            isFollowed: isFollowed,
            onTap: onRestaurantTap,
            onFollow: onFollow,
          ),
          if (publication.imageUrls.isNotEmpty)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.zero, bottom: Radius.zero),
              child: CachedNetworkImage(
                imageUrl: publication.imageUrls.first,
                height: 220,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  height: 220,
                  color: AppColors.surfaceHighlight,
                ),
                errorWidget: (context, url, error) => Container(
                  height: 220,
                  color: AppColors.surfaceHighlight,
                  child: const Icon(Icons.image, color: AppColors.textTertiary),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.m),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(publication.title, style: AppTypography.titleMedium),
                if (publication.description.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(publication.description, style: AppTypography.bodyMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                ],
                if (publication.price != null) ...[
                  const SizedBox(height: AppSpacing.s),
                  Text('\$${publication.price!.toStringAsFixed(0)}', style: AppTypography.headlineMedium.copyWith(color: AppColors.accent)),
                ],
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    _IconButton(
                      icon: isLiked ? Icons.favorite : Icons.favorite_border,
                      color: isLiked ? AppColors.error : AppColors.textSecondary,
                      onTap: onLike,
                      label: likeCount > 0 ? '$likeCount' : '',
                    ),
                    const Spacer(),
                    _IconButton(icon: Icons.add_shopping_cart, color: AppColors.primary, onTap: onAddToCart, label: 'Carrito'),
                    const SizedBox(width: AppSpacing.s),
                    SizedBox(
                      height: 32,
                      child: ElevatedButton(
                        onPressed: onOrderNow,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
                          textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 12),
                        ),
                        child: const Text('Ordenar'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RestaurantHeader extends StatelessWidget {
  final String restaurantName;
  final String? restaurantLogo;
  final bool isFollowed;
  final VoidCallback onTap;
  final VoidCallback onFollow;

  const _RestaurantHeader({
    required this.restaurantName,
    this.restaurantLogo,
    required this.isFollowed,
    required this.onTap,
    required this.onFollow,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.sm, AppSpacing.s, AppSpacing.sm),
      child: Row(
        children: [
          GestureDetector(
            onTap: onTap,
            child: Row(
              children: [
                ClipOval(
                  child: SizedBox(
                    width: 36, height: 36,
                    child: restaurantLogo != null && restaurantLogo!.isNotEmpty
                        ? CachedNetworkImage(imageUrl: restaurantLogo!, fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: AppColors.surfaceHighlight),
                            errorWidget: (context, url, error) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.store, color: AppColors.textSecondary, size: 18)))
                        : Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.store, color: AppColors.textSecondary, size: 18)),
                  ),
                ),
                const SizedBox(width: AppSpacing.s),
                Text(restaurantName, style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const Spacer(),
          SizedBox(
            height: 28,
            child: TextButton(
              onPressed: onFollow,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                foregroundColor: isFollowed ? AppColors.textTertiary : AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(color: isFollowed ? AppColors.textTertiary.withValues(alpha: 0.3) : AppColors.primary.withValues(alpha: 0.5)),
                ),
                textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w600, fontSize: 12),
              ),
              child: Text(isFollowed ? 'Siguiendo' : 'Seguir'),
            ),
          ),
        ],
      ),
    );
  }
}

class _IconButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final String label;

  const _IconButton({required this.icon, required this.color, required this.onTap, required this.label});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: color),
          if (label.isNotEmpty) ...[
            const SizedBox(width: 4),
            Text(label, style: AppTypography.bodyMedium.copyWith(color: color, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}
