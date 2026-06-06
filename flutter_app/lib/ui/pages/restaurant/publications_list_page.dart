import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/publication_model.dart';
import '../../../services/publication_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/futuristic_background.dart';
import '../../components/primary_button.dart';

class PublicationsListPage extends ConsumerStatefulWidget {
  const PublicationsListPage({super.key});

  @override
  ConsumerState<PublicationsListPage> createState() =>
      _PublicationsListPageState();
}

class _PublicationsListPageState extends ConsumerState<PublicationsListPage> {
  List<RestaurantPublication>? _publications;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final service = ref.read(publicationServiceProvider);
      final pubs = await service.fetchPublications();
      if (mounted) setState(() { _publications = pubs; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deletePublication(RestaurantPublication pub) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Eliminar publicación'),
        content: Text('¿Eliminar "${pub.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      final service = ref.read(publicationServiceProvider);
      await service.deletePublication(pub.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Publicación eliminada')),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
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
                  AppSpacing.m, AppSpacing.l, AppSpacing.m, 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Mis Publicaciones',
                      style: AppTypography.headlineMedium,
                    ),
                    TextButton.icon(
                      onPressed: () => context.push('/restaurant/publications/create'),
                      icon: const Icon(Icons.add, color: AppColors.primary, size: 20),
                      label: Text(
                        'Nueva',
                        style: AppTypography.labelLarge.copyWith(color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                ),
              )
            else if (_publications == null || _publications!.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.menu_book_outlined,
                        size: 64,
                        color: AppColors.textTertiary.withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: AppSpacing.m),
                      Text(
                        'No hay publicaciones',
                        style: AppTypography.titleMedium.copyWith(
                          color: AppColors.textTertiary.withValues(alpha: 0.5),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.l),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
                        child: PrimaryButton(
                          label: 'Crear primera publicación',
                          onPressed: () =>
                              context.push('/restaurant/publications/create'),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.m, AppSpacing.m, AppSpacing.m, 96,
                ),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final pub = _publications![index];
                      return _PublicationCard(
                        publication: pub,
                        onEdit: () => context.push(
                          '/restaurant/publications/edit',
                          extra: pub,
                        ),
                        onDelete: () => _deletePublication(pub),
                      );
                    },
                    childCount: _publications!.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PublicationCard extends StatelessWidget {
  final RestaurantPublication publication;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _PublicationCard({
    required this.publication,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.m),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppRadius.m),
              ),
              child: Container(
                height: 160,
                color: AppColors.surfaceHighlight,
                child: publication.imageUrls.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: publication.imageUrls.first,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: AppColors.surfaceHighlight,
                          child: const Center(
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: AppColors.surfaceHighlight,
                          child: const Icon(
                            Icons.broken_image_outlined,
                            color: AppColors.textTertiary,
                            size: 40,
                          ),
                        ),
                      )
                    : const Center(
                        child: Icon(
                          Icons.image_outlined,
                          color: AppColors.textTertiary,
                          size: 48,
                        ),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.m),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          publication.title,
                          style: AppTypography.titleMedium,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.s),
                      _StatusChip(type: publication.type),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.s),
                  Text(
                    publication.description,
                    style: AppTypography.bodyMedium,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (publication.price != null)
                        Text(
                          '\$${publication.price!.toStringAsFixed(0)}',
                          style: AppTypography.titleLarge.copyWith(
                            color: AppColors.accent,
                          ),
                        )
                      else
                        const SizedBox.shrink(),
                      if (publication.imageUrls.length > 1)
                        Text(
                          '${publication.imageUrls.length} fotos',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                  const Divider(color: AppColors.divider, height: AppSpacing.l),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton.icon(
                        onPressed: onEdit,
                        icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.info),
                        label: Text(
                          'Editar',
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.info,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.s),
                      TextButton.icon(
                        onPressed: onDelete,
                        icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                        label: Text(
                          'Eliminar',
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.error,
                            fontSize: 13,
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

class _StatusChip extends StatelessWidget {
  final String? type;
  const _StatusChip({this.type});

  @override
  Widget build(BuildContext context) {
    final label = type ?? 'General';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppRadius.s),
      ),
      child: Text(
        label,
        style: AppTypography.labelSmall.copyWith(
          color: AppColors.primary,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
