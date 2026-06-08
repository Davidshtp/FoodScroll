import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/publication_model.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../services/publication_service.dart';
import '../../../services/engagement_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_typography.dart';

class PublicationViewerPage extends ConsumerStatefulWidget {
  final List<RestaurantPublication> publications;
  final int initialIndex;
  final RestaurantProfile profile;
  final bool isOwner;
  final VoidCallback? onOrderNow;

  const PublicationViewerPage({
    super.key,
    required this.publications,
    required this.initialIndex,
    required this.profile,
    this.isOwner = false,
    this.onOrderNow,
  });

  @override
  ConsumerState<PublicationViewerPage> createState() => _PublicationViewerPageState();
}

class _PublicationViewerPageState extends ConsumerState<PublicationViewerPage> {
  late PageController _pageController;
  late int _currentPubIndex;
  int _currentImageIndex = 0;
  bool _isLiked = false;
  int _likeCount = 0;
  List<Comment> _comments = [];

  @override
  void initState() {
    super.initState();
    _currentPubIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _loadEngagement();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  RestaurantPublication get _currentPub => widget.publications[_currentPubIndex];

  Future<void> _loadEngagement() {
    return _loadEngagementFor(widget.publications[_currentPubIndex].id);
  }

  Future<void> _loadEngagementFor(String pubId) async {
    try {
      final engagement = ref.read(engagementServiceProvider);
      final results = await Future.wait([
        engagement.checkLike(pubId).catchError((_) => false),
        engagement.likeCount(pubId).catchError((_) => 0),
        engagement.getComments(pubId).catchError((_) => <Comment>[]),
      ]);
      if (mounted) {
        setState(() {
          _isLiked = results[0] as bool;
          _likeCount = results[1] as int;
          _comments = results[2] as List<Comment>;
        });
      }
    } catch (e) {
      debugPrint('A5 _loadEngagementFor error: $e');
    }
  }

  Future<void> _toggleLike() async {
    try {
      final engagement = ref.read(engagementServiceProvider);
      final result = await engagement.toggleLike(_currentPub.id);
      if (mounted) {
        setState(() {
          _isLiked = result.liked;
          _likeCount = result.count;
        });
      }
    } catch (_) {}
  }

  Future<void> _addComment(String text) async {
    if (text.trim().isEmpty) return;
    try {
      final engagement = ref.read(engagementServiceProvider);
      await engagement.addComment(
        publicationId: _currentPub.id,
        text: text.trim(),
      );
      await _loadEngagementFor(_currentPub.id);
    } catch (_) {}
  }

  Future<void> _deleteComment(String commentId) async {
    try {
      final engagement = ref.read(engagementServiceProvider);
      await engagement.deleteComment(commentId);
      if (mounted) {
        setState(() => _comments.removeWhere((c) => c.id == commentId));
      }
    } catch (_) {}
  }

  void _showOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4,
                decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.edit_outlined, color: Colors.white70),
              title: const Text('Editar publicación', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                context.push('/restaurant/publications/edit', extra: _currentPub);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.error),
              title: const Text('Eliminar publicación', style: TextStyle(color: AppColors.error)),
              onTap: () {
                Navigator.pop(ctx);
                _confirmDelete();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Eliminar publicación'),
        content: const Text('¿Estás seguro de eliminar esta publicación?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final service = ref.read(publicationServiceProvider);
      await service.deletePublication(_currentPub.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Publicación eliminada')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Publicaciones',
          style: AppTypography.titleMedium.copyWith(color: Colors.white),
        ),
      ),
      body: Stack(
        children: [
          GestureDetector(
        onVerticalDragEnd: (details) {
          if (details.primaryVelocity != null && details.primaryVelocity! > 500) {
            Navigator.pop(context);
          }
        },
        child: PageView.builder(
          controller: _pageController,
          itemCount: widget.publications.length,
          onPageChanged: (index) {
            setState(() {
              _currentPubIndex = index;
              _currentImageIndex = 0;
            });
            _loadEngagementFor(widget.publications[index].id);
          },
          itemBuilder: (context, index) {
            final pub = widget.publications[index];
            return _PublicationPost(
              publication: pub,
              profile: widget.profile,
              isOwner: widget.isOwner,
              isLiked: index == _currentPubIndex ? _isLiked : false,
              likeCount: index == _currentPubIndex ? _likeCount : 0,
              comments: index == _currentPubIndex ? _comments : [],
              currentImageIndex: index == _currentPubIndex ? _currentImageIndex : 0,
              onImageChanged: (i) {
                if (index == _currentPubIndex) {
                  setState(() => _currentImageIndex = i);
                }
              },
              onLike: index == _currentPubIndex ? _toggleLike : null,
              onAddComment: index == _currentPubIndex ? _addComment : null,
              onDeleteComment: index == _currentPubIndex ? _deleteComment : null,
              onOptions: index == _currentPubIndex && widget.isOwner ? _showOptions : null,
              onOrderNow: widget.onOrderNow,
            );
          },
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
              child: const Text('A5', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

class _PublicationPost extends StatelessWidget {
  final RestaurantPublication publication;
  final RestaurantProfile profile;
  final bool isOwner;
  final bool isLiked;
  final int likeCount;
  final List<Comment> comments;
  final int currentImageIndex;
  final ValueChanged<int>? onImageChanged;
  final VoidCallback? onLike;
  final ValueChanged<String>? onAddComment;
  final ValueChanged<String>? onDeleteComment;
  final VoidCallback? onOptions;
  final VoidCallback? onOrderNow;

  const _PublicationPost({
    required this.publication,
    required this.profile,
    required this.isOwner,
    required this.isLiked,
    required this.likeCount,
    required this.comments,
    required this.currentImageIndex,
    this.onImageChanged,
    this.onLike,
    this.onAddComment,
    this.onDeleteComment,
    this.onOptions,
    this.onOrderNow,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _HeaderRow(
            logoUrl: profile.logoUrl,
            name: profile.name,
            dateStr: publication.publishedAt ?? '',
            onOptions: onOptions,
          ),
          _ImageCarousel(
            imageUrls: publication.imageUrls,
            currentIndex: currentImageIndex,
            onPageChanged: onImageChanged,
          ),
          _PostActions(
            isLiked: isLiked,
            likeCount: likeCount,
            onLike: onLike,
            showLike: true,
          ),
          if (publication.title.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Text(publication.title,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
            ),
          if (publication.description.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: Text(publication.description,
                  style: const TextStyle(color: Colors.white70, fontSize: 14)),
            ),
          if (publication.price != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
              child: Text('\$${publication.price!.toStringAsFixed(0)}',
                  style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700, fontSize: 16)),
            ),
          const SizedBox(height: 8),
          _CommentsSection(
            comments: comments,
            onDeleteComment: onDeleteComment,
            onAddComment: onAddComment,
          ),
          if (onOrderNow != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton(
                  onPressed: onOrderNow,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  child: const Text('Ordenar ahora'),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeaderRow extends StatelessWidget {
  final String? logoUrl;
  final String name;
  final String dateStr;
  final VoidCallback? onOptions;

  const _HeaderRow({
    required this.logoUrl,
    required this.name,
    required this.dateStr,
    this.onOptions,
  });

  @override
  Widget build(BuildContext context) {
    final date = _relativeDate(dateStr);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          ClipOval(
            child: SizedBox(
              width: 36, height: 36,
              child: logoUrl != null && logoUrl!.isNotEmpty
                  ? CachedNetworkImage(imageUrl: logoUrl!, fit: BoxFit.cover,
                      placeholder: (_, _) => Container(color: Colors.white24),
                      errorWidget: (_, _, _) => Container(color: Colors.white24, child: const Icon(Icons.restaurant, color: Colors.white38, size: 18)))
                  : Container(color: Colors.white24, child: const Icon(Icons.restaurant, color: Colors.white38, size: 18)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                if (date.isNotEmpty)
                  Text(date, style: const TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
          ),
          if (onOptions != null)
            IconButton(
              icon: const Icon(Icons.more_horiz, color: Colors.white, size: 22),
              onPressed: onOptions,
            ),
        ],
      ),
    );
  }

  String _relativeDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Justo ahora';
      if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
      if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
      if (diff.inDays < 30) return 'Hace ${diff.inDays} d';
      return '${dt.day} de ${_months[dt.month - 1]} de ${dt.year}';
    } catch (_) {
      return '';
    }
  }

  static const _months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
}

class _ImageCarousel extends StatefulWidget {
  final List<String> imageUrls;
  final int currentIndex;
  final ValueChanged<int>? onPageChanged;

  const _ImageCarousel({
    required this.imageUrls,
    required this.currentIndex,
    this.onPageChanged,
  });

  @override
  State<_ImageCarousel> createState() => _ImageCarouselState();
}

class _ImageCarouselState extends State<_ImageCarousel> {
  late PageController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: widget.currentIndex);
  }

  @override
  void didUpdateWidget(_ImageCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentIndex != oldWidget.currentIndex) {
      _controller.jumpToPage(widget.currentIndex);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.imageUrls.isEmpty) {
      return Container(
        height: 300,
        color: Colors.white12,
        child: const Center(child: Icon(Icons.image_outlined, color: Colors.white24, size: 48)),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.width * (4 / 3),
          child: PageView.builder(
            controller: _controller,
            itemCount: widget.imageUrls.length,
            onPageChanged: widget.onPageChanged,
            itemBuilder: (context, index) {
              return CachedNetworkImage(
                imageUrl: widget.imageUrls[index],
                fit: BoxFit.contain,
                placeholder: (_, _) => Container(color: Colors.white12, child: const Center(child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white38))),
                errorWidget: (_, _, _) => Container(color: Colors.white12, child: const Icon(Icons.broken_image_outlined, color: Colors.white24, size: 48)),
              );
            },
          ),
        ),
        if (widget.imageUrls.length > 1)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(widget.imageUrls.length, (i) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == widget.currentIndex ? 8 : 6,
                  height: i == widget.currentIndex ? 8 : 6,
                  decoration: BoxDecoration(
                    color: i == widget.currentIndex ? AppColors.primary : Colors.white38,
                    shape: BoxShape.circle,
                  ),
                );
              }),
            ),
          ),
      ],
    );
  }
}

class _PostActions extends StatelessWidget {
  final bool isLiked;
  final int likeCount;
  final VoidCallback? onLike;
  final bool showLike;

  const _PostActions({
    required this.isLiked,
    required this.likeCount,
    this.onLike,
    this.showLike = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Row(
        children: [
          if (showLike)
            GestureDetector(
              onTap: onLike,
              child: Icon(
                isLiked ? Icons.favorite : Icons.favorite_border,
                color: isLiked ? AppColors.error : Colors.white,
                size: 26,
              ),
            ),
          if (showLike) const SizedBox(width: 8),
          Text(
            '$likeCount me gusta',
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

class _CommentsSection extends StatefulWidget {
  final List<Comment> comments;
  final ValueChanged<String>? onDeleteComment;
  final ValueChanged<String>? onAddComment;

  const _CommentsSection({
    required this.comments,
    this.onDeleteComment,
    this.onAddComment,
  });

  @override
  State<_CommentsSection> createState() => _CommentsSectionState();
}

class _CommentsSectionState extends State<_CommentsSection> {
  final _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.comments.isNotEmpty)
          ...widget.comments.map((comment) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: '${comment.userName.isNotEmpty ? comment.userName : (comment.userRole.toLowerCase() == 'customer' ? 'Cliente' : (comment.userRole.toLowerCase() == 'restaurant' ? 'Restaurante' : comment.userId.split('-').first))} ',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        TextSpan(
                          text: comment.text,
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
                if (widget.onDeleteComment != null)
                  GestureDetector(
                    onTap: () => widget.onDeleteComment!(comment.id),
                    child: const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Icon(Icons.close, size: 14, color: Colors.white38),
                    ),
                  ),
              ],
            ),
          )),
        const SizedBox(height: 4),
        const Divider(color: Colors.white12, height: 1, thickness: 0.5),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: Colors.white12,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: TextField(
                    controller: _commentController,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: const InputDecoration(
                      hintText: 'Agrega un comentario...',
                      hintStyle: TextStyle(color: Colors.white38, fontSize: 14),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () {
                  widget.onAddComment?.call(_commentController.text);
                  _commentController.clear();
                },
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
    );
  }
}
