import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/publication_model.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../models/user_model.dart';
import '../../../services/restaurant_service.dart';
import '../../../services/publication_service.dart';
import '../../../services/engagement_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/futuristic_background.dart';
import '../restaurant/publication_viewer_page.dart';

class RestaurantProfilePage extends ConsumerStatefulWidget {
  const RestaurantProfilePage({super.key});

  @override
  ConsumerState<RestaurantProfilePage> createState() => _RestaurantProfilePageState();
}

class _RestaurantProfilePageState extends ConsumerState<RestaurantProfilePage> {
  RestaurantProfile? _profile;
  AuthUser? _authUser;
  bool _isLoading = true;
  List<RestaurantPublication> _publications = [];
  int _followersCount = 0;
  bool _showFullDescription = false;

  final Map<String, bool> _likedMap = {};
  final Map<String, int> _likeCountMap = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final auth = ref.read(authServiceProvider);
      final me = await auth.fetchMe();

      final restaurantService = ref.read(restaurantServiceProvider);
      final profile = await restaurantService.fetchProfile();

      final pubService = ref.read(publicationServiceProvider);
      final pubs = await pubService.fetchPublications();

      final engagement = ref.read(engagementServiceProvider);
      int followers = 0;
      try {
        followers = await engagement.followersCount(profile.id);
      } catch (_) {}

      if (mounted) {
        setState(() {
          _profile = profile;
          _authUser = me;
          _publications = pubs;
          _followersCount = followers;
          _isLoading = false;
        });
      }

      await _initEngagementData(pubs, engagement);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _initEngagementData(List<RestaurantPublication> pubs, EngagementService engagement) async {
    if (pubs.isEmpty) return;
    try {
      final likeResults = await Future.wait(
        pubs.map((pub) => Future.wait([
          engagement.likeCount(pub.id).catchError((_) => 0),
          engagement.checkLike(pub.id).catchError((_) => false),
        ])),
      );
      if (mounted) {
        setState(() {
          for (int i = 0; i < pubs.length; i++) {
            _likeCountMap[pubs[i].id] = likeResults[i][0] as int;
            _likedMap[pubs[i].id] = likeResults[i][1] as bool;
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
    if (_publications.isEmpty) return '';
    final newest = _publications
        .map((p) => p.publishedAt)
        .whereType<String>()
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _profile == null) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary));
    }

    final profile = _profile;
    if (profile == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('No se pudo cargar el perfil'),
            const SizedBox(height: AppSpacing.m),
            TextButton(onPressed: _loadData, child: const Text('Reintentar')),
          ],
        ),
      );
    }

    final isVerified = _authUser?.isVerified ?? false;
    final hasDescription = profile.description.isNotEmpty;
    final shouldTruncate = profile.description.length > 120;

    return Stack(
      children: [
        FuturisticBackground(
      child: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _loadData,
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
                    child: profile.bannerUrl != null && profile.bannerUrl!.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: profile.bannerUrl!,
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
                            child: profile.logoUrl != null && profile.logoUrl!.isNotEmpty
                                ? CachedNetworkImage(imageUrl: profile.logoUrl!, fit: BoxFit.cover,
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
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Flexible(
                          child: Text(profile.name,
                              style: AppTypography.titleLarge,
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                        if (isVerified) ...[
                          const SizedBox(width: AppSpacing.xs),
                          Icon(Icons.verified, color: AppColors.success, size: 18),
                        ],
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
                        if (_publications.isNotEmpty) ...[
                          const SizedBox(width: AppSpacing.s),
                          Text(
                            '· ${_publications.length} publicaciones',
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
                    if (hasDescription) ...[
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        _showFullDescription || !shouldTruncate
                            ? profile.description
                            : '${profile.description.substring(0, 120)}...',
                        style: AppTypography.bodyMedium.copyWith(color: AppColors.textPrimary),
                      ),
                      if (shouldTruncate)
                        GestureDetector(
                          onTap: () => setState(() => _showFullDescription = !_showFullDescription),
                          child: Padding(
                            padding: const EdgeInsets.only(top: AppSpacing.xs),
                            child: Text(
                              _showFullDescription ? 'Ver menos' : 'Ver más',
                              style: AppTypography.labelLarge.copyWith(
                                  color: AppColors.accent, fontSize: 13),
                            ),
                          ),
                        ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.m),
              if (_publications.isNotEmpty)
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 1.5,
                    mainAxisSpacing: 1.5,
                    childAspectRatio: 2 / 3,
                  ),
                  itemCount: _publications.length,
                  itemBuilder: (context, index) {
                    final pub = _publications[index];
                    final isLiked = _likedMap[pub.id] ?? false;
                    final likeCount = _likeCountMap[pub.id] ?? 0;
                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PublicationViewerPage(
                              publications: _publications,
                              initialIndex: index,
                              profile: profile,
                              isOwner: true,
                            ),
                          ),
                        );
                      },
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
              child: const Text('A1', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
    );
  }
}
