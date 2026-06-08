import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/feed_publication_model.dart';
import '../../../services/engagement_service.dart';
import '../../../services/feed_service.dart';
import '../../../state/cart_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';

class RestaurantPublicProfilePage extends ConsumerStatefulWidget {
  final String restaurantId;

  const RestaurantPublicProfilePage({super.key, required this.restaurantId});

  @override
  ConsumerState<RestaurantPublicProfilePage> createState() => _RestaurantPublicProfilePageState();
}

class _RestaurantPublicProfilePageState extends ConsumerState<RestaurantPublicProfilePage> {
  List<FeedPublication>? _publications;
  bool _isLoading = true;
  bool _isFollowed = false;
  int _followersCount = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final response = await ref.read(feedServiceProvider).fetchFeed();
      final engagement = ref.read(engagementServiceProvider);

      final restaurantPubs = response.publications.where((p) => p.restaurantId == widget.restaurantId).toList();
      final followersCount = await engagement.followersCount(widget.restaurantId);

      bool followed = false;
      try {
        followed = await engagement.checkFollow(widget.restaurantId);
      } catch (_) {}

      if (mounted) {
        setState(() {
          _publications = restaurantPubs;
          _isFollowed = followed;
          _followersCount = followersCount;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleFollow() async {
    final service = ref.read(engagementServiceProvider);
    try {
      if (_isFollowed) {
        await service.unfollowRestaurant(widget.restaurantId);
      } else {
        await service.followRestaurant(widget.restaurantId);
      }
      if (mounted) {
        setState(() {
          _isFollowed = !_isFollowed;
          _followersCount += _isFollowed ? 1 : -1;
        });
      }
    } catch (_) {}
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

  @override
  Widget build(BuildContext context) {
    final restaurantName = _publications != null && _publications!.isNotEmpty
        ? _publications!.first.restaurantName
        : 'Restaurante';
    final restaurantLogo = _publications != null && _publications!.isNotEmpty
        ? _publications!.first.restaurantLogo
        : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(restaurantName, style: AppTypography.titleLarge),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
          : CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _ProfileHeader(
                    restaurantName: restaurantName,
                    restaurantLogo: restaurantLogo,
                    isFollowed: _isFollowed,
                    followersCount: _followersCount,
                    onFollow: _toggleFollow,
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
                  sliver: SliverToBoxAdapter(
                    child: Text('PUBLICACIONES', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.s)),
                if (_publications == null || _publications!.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.image_not_supported_outlined, size: 48, color: AppColors.textTertiary.withValues(alpha: 0.3)),
                          const SizedBox(height: AppSpacing.s),
                          Text('Sin publicaciones', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
                        ],
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(AppSpacing.m, 0, AppSpacing.m, 96),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final pub = _publications![index];
                          return _PublicProfileCard(
                            publication: pub,
                            onAddToCart: () => _addToCart(pub),
                          );
                        },
                        childCount: _publications!.length,
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final String restaurantName;
  final String? restaurantLogo;
  final bool isFollowed;
  final int followersCount;
  final VoidCallback onFollow;

  const _ProfileHeader({
    required this.restaurantName,
    this.restaurantLogo,
    required this.isFollowed,
    required this.followersCount,
    required this.onFollow,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.m),
      child: Column(
        children: [
          ClipOval(
            child: SizedBox(
              width: 80, height: 80,
              child: restaurantLogo != null && restaurantLogo!.isNotEmpty
                  ? CachedNetworkImage(imageUrl: restaurantLogo!, fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: AppColors.surfaceHighlight),
                      errorWidget: (context, url, error) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.store, color: AppColors.textSecondary, size: 40)))
                  : Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.store, color: AppColors.textSecondary, size: 40)),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(restaurantName, style: AppTypography.titleLarge),
          const SizedBox(height: AppSpacing.xs),
          Text('$followersCount seguidores', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
          const SizedBox(height: AppSpacing.m),
          SizedBox(
            width: 120,
            child: ElevatedButton(
              onPressed: onFollow,
              style: ElevatedButton.styleFrom(
                backgroundColor: isFollowed ? AppColors.surfaceHighlight : AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              child: Text(isFollowed ? 'Siguiendo' : 'Seguir', style: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: AppSpacing.l),
        ],
      ),
    );
  }
}

class _PublicProfileCard extends StatelessWidget {
  final FeedPublication publication;
  final VoidCallback onAddToCart;

  const _PublicProfileCard({required this.publication, required this.onAddToCart});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (publication.imageUrls.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.m)),
                child: CachedNetworkImage(
                  imageUrl: publication.imageUrls.first,
                  height: 200, width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(height: 200, color: AppColors.surfaceHighlight),
                  errorWidget: (context, url, error) => Container(height: 200, color: AppColors.surfaceHighlight, child: const Icon(Icons.image, color: AppColors.textTertiary)),
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
                      const Icon(Icons.favorite_border, size: 18, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text('0', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, fontSize: 13)),
                      const SizedBox(width: AppSpacing.m),
                      const Icon(Icons.chat_bubble_outline, size: 18, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text('0', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, fontSize: 13)),
                      const Spacer(),
                      SizedBox(
                        height: 32,
                        child: ElevatedButton.icon(
                          onPressed: onAddToCart,
                          icon: const Icon(Icons.add_shopping_cart, size: 16),
                          label: const Text('Carrito'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
