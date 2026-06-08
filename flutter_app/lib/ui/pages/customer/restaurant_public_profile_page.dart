import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/feed_publication_model.dart';
import '../../../models/publication_model.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../services/engagement_service.dart';
import '../../../services/feed_service.dart';
import '../../../services/restaurant_service.dart';
import '../../../state/cart_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../restaurant/publication_viewer_page.dart';

class RestaurantPublicProfilePage extends ConsumerStatefulWidget {
  final String restaurantId;

  const RestaurantPublicProfilePage({super.key, required this.restaurantId});

  @override
  ConsumerState<RestaurantPublicProfilePage> createState() => _RestaurantPublicProfilePageState();
}

class _RestaurantPublicProfilePageState extends ConsumerState<RestaurantPublicProfilePage> {
  List<FeedPublication>? _publications;
  RestaurantProfile? _profile;
  bool _isLoading = true;
  bool _isFollowed = false;
  int _followersCount = 0;

  final Map<String, bool> _likedMap = {};
  final Map<String, int> _likeCountMap = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final engagement = ref.read(engagementServiceProvider);
      final feedService = ref.read(feedServiceProvider);
      final restaurantService = ref.read(restaurantServiceProvider);

      final response = await feedService.fetchFeed();

      RestaurantProfile? profile;
      try {
        profile = await restaurantService.fetchPublicProfile(widget.restaurantId);
      } catch (_) {
        profile = null;
      }

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
          _profile = profile;
          _isLoading = false;
        });
      }

      await _initEngagementData(restaurantPubs, engagement);
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _initEngagementData(List<FeedPublication> pubs, EngagementService engagement) async {
    if (pubs.isEmpty) return;
    try {
      final results = await Future.wait(
        pubs.map((pub) => Future.wait([
          engagement.likeCount(pub.id).catchError((_) => 0),
          engagement.checkLike(pub.id).catchError((_) => false),
        ])),
      );
      if (mounted) {
        setState(() {
          for (int i = 0; i < pubs.length; i++) {
            _likeCountMap[pubs[i].id] = results[i][0] as int;
            _likedMap[pubs[i].id] = results[i][1] as bool;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _toggleLike(String publicationId) async {
    final engagement = ref.read(engagementServiceProvider);
    final currentLiked = _likedMap[publicationId] ?? false;
    final currentCount = _likeCountMap[publicationId] ?? 0;

    setState(() {
      _likedMap[publicationId] = !currentLiked;
      _likeCountMap[publicationId] = currentLiked ? currentCount - 1 : currentCount + 1;
    });

    try {
      final result = await engagement.toggleLike(publicationId);
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

  String get _relativeDate {
    if (_publications == null || _publications!.isEmpty) return '';
    final newest = _publications!
        .map((p) => p.publishedAt)
        .reduce((a, b) => a.compareTo(b) > 0 ? a : b);
    return _timeAgo(newest);
  }

  String _timeAgo(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Justo ahora';
      if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
      if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
      if (diff.inDays < 7) return 'Hace ${diff.inDays} d';
      return '${dt.day} de ${_months[dt.month - 1]} de ${dt.year}';
    } catch (_) {
      return '';
    }
  }

  static const _months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  String get _restaurantName => _profile != null
      ? _profile!.name
      : (_publications != null && _publications!.isNotEmpty
          ? _publications!.first.restaurantName
          : 'Restaurante');

  String? get _restaurantLogo => _profile?.logoUrl ?? (_publications != null && _publications!.isNotEmpty
      ? _publications!.first.restaurantLogo
      : null);

  String get _description => _profile?.description ?? '';

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

  void _orderPublication(int index) {
    final pub = _publications![index];
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
    Navigator.pop(context);
    context.push('/cart');
  }

  void _openViewer(int index) {
    if (_publications == null || _publications!.isEmpty) return;

    final pubs = _publications!.map((fp) => RestaurantPublication(
      id: fp.id,
      restaurantId: fp.restaurantId,
      title: fp.title,
      description: fp.description,
      type: fp.type,
      imageUrls: fp.imageUrls,
      price: fp.price,
      publishedAt: fp.publishedAt,
    )).toList();

    final profile = RestaurantProfile(
      id: widget.restaurantId,
      userId: widget.restaurantId,
      name: _restaurantName,
      description: _description,
      phone: '',
      email: '',
      logoUrl: _restaurantLogo,
      bannerUrl: null,
    );

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PublicationViewerPage(
          publications: pubs,
          initialIndex: index,
          profile: profile,
          isOwner: false,
          onOrderNow: () => _orderPublication(index),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _publications == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(_restaurantName, style: AppTypography.titleLarge),
      ),
      body: Stack(
        children: [
          RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    height: 120,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceHighlight,
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _profile?.bannerUrl != null && _profile!.bannerUrl!.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: _profile!.bannerUrl!,
                            fit: BoxFit.cover,
                            placeholder: (_, _) => Container(color: AppColors.surfaceHighlight),
                            errorWidget: (_, _, _) => Container(color: AppColors.surfaceHighlight),
                          )
                        : Container(color: AppColors.surfaceHighlight),
                  ),
                  Positioned(
                    bottom: -35,
                    left: 0,
                    right: 0,
                    child: Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.background, width: 3),
                        ),
                        child: ClipOval(
                          child: SizedBox(
                            width: 80, height: 80,
                            child: _restaurantLogo != null && _restaurantLogo!.isNotEmpty
                                ? CachedNetworkImage(imageUrl: _restaurantLogo!, fit: BoxFit.cover,
                                    placeholder: (_, _) => Container(color: AppColors.surfaceHighlight),
                                    errorWidget: (_, _, _) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.restaurant, color: AppColors.textSecondary, size: 32)))
                                : Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.restaurant, color: AppColors.textSecondary, size: 32)),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 42),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(_restaurantName,
                              style: AppTypography.titleLarge,
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        Icon(Icons.verified, color: AppColors.success, size: 18),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Row(
                      children: [
                        Text(
                          '$_followersCount seguidores',
                          style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                        ),
                        if (_publications != null && _publications!.isNotEmpty) ...[
                          const SizedBox(width: AppSpacing.s),
                          Text(
                            '· ${_publications!.length} publicaciones',
                            style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary),
                          ),
                          const SizedBox(width: AppSpacing.s),
                          Text(
                            '· Última $_relativeDate',
                            style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        SizedBox(
                          height: 32,
                          child: ElevatedButton(
                            onPressed: _toggleFollow,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isFollowed ? AppColors.surfaceHighlight : AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m),
                              textStyle: AppTypography.labelLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 13),
                            ),
                            child: Text(_isFollowed ? 'Siguiendo' : 'Seguir'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.m),
              if (_publications != null && _publications!.isNotEmpty)
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 1.5,
                    mainAxisSpacing: 1.5,
                    childAspectRatio: 2 / 3,
                  ),
                  itemCount: _publications!.length,
                  itemBuilder: (context, index) {
                    final pub = _publications![index];
                    final isLiked = _likedMap[pub.id] ?? false;
                    final likeCount = _likeCountMap[pub.id] ?? 0;
                    return GestureDetector(
                      onTap: () => _openViewer(index),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Container(
                            color: AppColors.surfaceHighlight,
                            child: pub.imageUrls.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: pub.imageUrls.first,
                                    fit: BoxFit.cover,
                                    placeholder: (_, _) => Container(color: AppColors.surfaceHighlight),
                                    errorWidget: (_, _, _) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.broken_image_outlined, color: AppColors.textTertiary, size: 20)),
                                  )
                                : Container(
                                    color: AppColors.surfaceHighlight,
                                    child: Center(
                                      child: Icon(Icons.image_outlined, color: AppColors.textTertiary.withValues(alpha: 0.4), size: 24),
                                    ),
                                  ),
                          ),
                          Positioned(
                            left: 6,
                            bottom: 6,
                            child: GestureDetector(
                              onTap: () => _toggleLike(pub.id),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isLiked ? Icons.favorite : Icons.favorite_border,
                                    color: isLiked ? AppColors.error : Colors.white,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    '$likeCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      shadows: [Shadow(color: Colors.black54, blurRadius: 2)],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.menu_book_outlined, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.3)),
                        const SizedBox(height: AppSpacing.m),
                        Text('Sin publicaciones', style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary.withValues(alpha: 0.5))),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 96),
            ],
          ),
        ),
      ),
          Positioned(
            top: 4,
            right: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text('A2', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
