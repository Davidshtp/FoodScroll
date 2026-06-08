import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../models/feed_publication_model.dart';
import '../../../services/feed_service.dart';
import '../../../services/engagement_service.dart';
import '../../../services/storage_service.dart';
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
      final feedService = ref.read(feedServiceProvider);
      final engagement = ref.read(engagementServiceProvider);

      final response = await feedService.fetchFeed(
        latitude: widget.latitude,
        longitude: widget.longitude,
      );
      final pubs = response.publications;

      if (mounted) {
        setState(() {
          _publications = pubs;
          _isLoading = false;
        });
      }

      await Future.wait([
        _initFollowState(pubs, engagement),
        _initLikeCounts(pubs, engagement),
      ]);
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _initFollowState(List<FeedPublication> pubs, EngagementService engagement) async {
    try {
      final me = await StorageService().getUser();
      final myId = me?['id']?.toString();
      if (myId == null) return;

      final following = await engagement.getFollowing(myId);
      final followedSet = following.toSet();

      if (mounted) {
        setState(() {
          for (final pub in pubs) {
            _followedMap[pub.restaurantId] = followedSet.contains(pub.restaurantId);
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _initLikeCounts(List<FeedPublication> pubs, EngagementService engagement) async {
    if (pubs.isEmpty) return;
    final results = await Future.wait(
      pubs.map((pub) => engagement.likeCount(pub.id).catchError((_) => 0)),
    );
    if (mounted) {
      setState(() {
        for (int i = 0; i < pubs.length; i++) {
          _likeCountMap[pubs[i].id] = results[i];
        }
      });
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

  Future<void> _showComments(FeedPublication pub) async {
    try {
      final engagement = ref.read(engagementServiceProvider);
      final comments = await engagement.getComments(pub.id);
      if (!mounted) return;

      showModalBottomSheet(
        context: context,
        backgroundColor: AppColors.surface,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (ctx) => _CommentSheet(
          publicationId: pub.id,
          initialComments: comments,
        ),
      );
    } catch (_) {}
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
        padding: EdgeInsets.zero,
        itemCount: _publications!.length,
        itemBuilder: (context, index) {
          final pub = _publications![index];
          final isLast = index == _publications!.length - 1;
          return Column(
            children: [
              _FeedCard(
                publication: pub,
                isLiked: _likedMap[pub.id] ?? false,
                likeCount: _likeCountMap[pub.id] ?? 0,
                isFollowed: _followedMap[pub.restaurantId] ?? false,
                onLike: () => _toggleLike(pub.id),
                onFollow: () => _toggleFollow(pub.restaurantId),
                onAddToCart: () => _addToCart(pub),
                onOrderNow: () => _orderNow(pub),
                onComment: () => _showComments(pub),
                onRestaurantTap: () => context.push(
                  '/restaurant-public-profile/${pub.restaurantId}',
                ),
              ),
              if (!isLast)
                Divider(height: 1, thickness: 0.5, color: AppColors.divider.withValues(alpha: 0.3)),
            ],
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
  final VoidCallback onComment;
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
    required this.onComment,
    required this.onRestaurantTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
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
          AspectRatio(
            aspectRatio: 1,
            child: CachedNetworkImage(
              imageUrl: publication.imageUrls.first,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(color: AppColors.surfaceHighlight),
              errorWidget: (context, url, error) => Container(
                color: AppColors.surfaceHighlight,
                child: const Icon(Icons.image, color: AppColors.textTertiary),
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Row(
                children: [
                  GestureDetector(
                    onTap: onLike,
                    child: Icon(
                      isLiked ? Icons.favorite : Icons.favorite_border,
                      size: 24,
                      color: isLiked ? AppColors.error : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: onComment,
                    child: const Icon(Icons.chat_bubble_outline, size: 22, color: AppColors.textPrimary),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: onAddToCart,
                    child: const Icon(Icons.add_shopping_cart, size: 22, color: AppColors.textPrimary),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    height: 30,
                    child: ElevatedButton(
                      onPressed: onOrderNow,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                      child: const Text('Ordenar'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '$likeCount me gusta',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    publication.restaurantName,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      publication.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
              if (publication.price != null) ...[
                const SizedBox(height: 2),
                Text(
                  '\$${publication.price!.toStringAsFixed(0)}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.accent),
                ),
              ],
              const SizedBox(height: 8),
            ],
          ),
        ),
      ],
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
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
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
                const SizedBox(width: 10),
                Text(restaurantName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              ],
            ),
          ),
          const Spacer(),
          SizedBox(
            height: 28,
            child: TextButton(
              onPressed: onFollow,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                foregroundColor: isFollowed ? AppColors.textTertiary : AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(color: isFollowed ? AppColors.textTertiary.withValues(alpha: 0.3) : AppColors.primary.withValues(alpha: 0.5)),
                ),
                textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
              ),
              child: Text(isFollowed ? 'Siguiendo' : 'Seguir'),
            ),
          ),
        ],
      ),
    );
  }
}

class _CommentSheet extends ConsumerStatefulWidget {
  final String publicationId;
  final List<Comment> initialComments;

  const _CommentSheet({required this.publicationId, required this.initialComments});

  @override
  ConsumerState<_CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends ConsumerState<_CommentSheet> {
  late List<Comment> _comments;
  final _controller = TextEditingController();
  final Set<String> _expandedComments = {};

  @override
  void initState() {
    super.initState();
    _comments = widget.initialComments;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _addComment() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    try {
      await ref.read(engagementServiceProvider).addComment(
        publicationId: widget.publicationId,
        text: text,
      );
      _controller.clear();
      final comments = await ref.read(engagementServiceProvider).getComments(widget.publicationId);
      if (mounted) setState(() => _comments = comments);
    } catch (_) {}
  }

  String _displayName(Comment c) {
    if (c.userName.isNotEmpty) return c.userName;
    if (c.userRole.toLowerCase() == 'customer') return 'Cliente';
    if (c.userRole.toLowerCase() == 'restaurant') return 'Restaurante';
    return c.userId.split('-').first;
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4,
                decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Text('Comentarios', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            const SizedBox(height: 8),
            const Divider(height: 1, thickness: 0.5, color: AppColors.divider),
            if (_comments.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('No hay comentarios'),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 300),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _comments.length,
                  itemBuilder: (context, index) {
                    final comment = _comments[index];
                    final isExpanded = _expandedComments.contains(comment.id);
                    final isLong = comment.text.length > 100;

                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: AppColors.surfaceHighlight,
                            child: comment.userImageUrl != null && comment.userImageUrl!.isNotEmpty
                                ? ClipOval(
                                    child: CachedNetworkImage(
                                      imageUrl: comment.userImageUrl!,
                                      fit: BoxFit.cover,
                                      width: 32, height: 32,
                                      placeholder: (_, _) => const Icon(Icons.person, size: 16, color: AppColors.textTertiary),
                                      errorWidget: (_, _, _) => const Icon(Icons.person, size: 16, color: AppColors.textTertiary),
                                    ),
                                  )
                                : const Icon(Icons.person, size: 16, color: AppColors.textTertiary),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _displayName(comment),
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  isExpanded || !isLong
                                      ? comment.text
                                      : '${comment.text.substring(0, 100)}...',
                                  style: const TextStyle(fontSize: 13),
                                ),
                                if (isLong)
                                  GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        if (isExpanded) {
                                          _expandedComments.remove(comment.id);
                                        } else {
                                          _expandedComments.add(comment.id);
                                        }
                                      });
                                    },
                                    child: Text(
                                      isExpanded ? 'Menos' : 'Más',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textTertiary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            const Divider(height: 1, thickness: 0.5, color: AppColors.divider),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceHighlight,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _controller,
                        style: const TextStyle(fontSize: 14),
                        decoration: const InputDecoration(
                          hintText: 'Agrega un comentario...',
                          hintStyle: TextStyle(color: AppColors.textTertiary, fontSize: 14),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: _addComment,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Text('Publicar',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
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
