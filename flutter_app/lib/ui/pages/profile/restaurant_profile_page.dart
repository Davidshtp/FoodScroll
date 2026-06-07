import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../models/user_model.dart';
import '../../../services/restaurant_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/futuristic_background.dart';

class RestaurantProfilePage extends ConsumerStatefulWidget {
  const RestaurantProfilePage({super.key});

  @override
  ConsumerState<RestaurantProfilePage> createState() => _RestaurantProfilePageState();
}

class _RestaurantProfilePageState extends ConsumerState<RestaurantProfilePage> {
  RestaurantProfile? _profile;
  AuthUser? _authUser;
  bool _isLoading = true;
  RestaurantAddress? _address;
  List<OpeningHour> _openingHours = [];

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

      RestaurantAddress? address;
      try { address = await restaurantService.fetchAddress(); } catch (_) {}
      List<OpeningHour> hours = [];
      try { hours = await restaurantService.fetchOpeningHours(); } catch (_) {}

      if (mounted) {
        setState(() {
          _profile = profile;
          _authUser = me;
          _address = address;
          _openingHours = hours;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _onVerifyEmail() async {
    await context.push('/verify-email');
    if (mounted) _loadData();
  }

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

    return FuturisticBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.m, AppSpacing.m, 96),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.s),
            Center(
              child: Column(
                children: [
                  ClipOval(
                    child: SizedBox(
                      width: 100, height: 100,
                      child: profile.logoUrl != null && profile.logoUrl!.isNotEmpty
                          ? CachedNetworkImage(imageUrl: profile.logoUrl!, fit: BoxFit.cover,
                              placeholder: (_, _) => Container(color: AppColors.surfaceHighlight),
                              errorWidget: (_, _, _) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.restaurant, color: AppColors.textSecondary, size: 40)))
                          : Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.restaurant, color: AppColors.textSecondary, size: 40)),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(profile.name, style: AppTypography.titleLarge, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, softWrap: true),
                  if (profile.description.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
                      child: Text(profile.description, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary), textAlign: TextAlign.center, maxLines: 4, overflow: TextOverflow.ellipsis, softWrap: true),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.m),
            _VerificationBadge(isVerified: isVerified, onVerifyTap: _onVerifyEmail),
            const SizedBox(height: AppSpacing.l),
            _PublicInfoRow(label: 'Teléfono', value: profile.phone),
            _PublicInfoRow(label: 'Correo', value: profile.email),
            const SizedBox(height: AppSpacing.l),
            Text('UBICACIÓN Y HORARIOS', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
            const SizedBox(height: AppSpacing.s),
            _PublicInfoRow(label: 'Dirección', value: _address?.address ?? 'No disponible'),
            _HoursPreview(hours: _openingHours),
          ],
        ),
      ),
    );
  }
}

class _VerificationBadge extends StatelessWidget {
  final bool isVerified;
  final VoidCallback? onVerifyTap;
  const _VerificationBadge({required this.isVerified, this.onVerifyTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isVerified ? AppColors.success.withValues(alpha: 0.1) : AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.m),
      ),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: AppSpacing.sm),
      child: Row(
        children: [
          Icon(isVerified ? Icons.verified : Icons.warning_amber_rounded, color: isVerified ? AppColors.success : AppColors.warning, size: 20),
          const SizedBox(width: AppSpacing.s),
          Expanded(child: Text(isVerified ? 'Correo verificado' : 'Correo no verificado',
              style: AppTypography.bodyMedium.copyWith(color: isVerified ? AppColors.success : AppColors.warning))),
          if (!isVerified)
            GestureDetector(
              onTap: onVerifyTap,
              child: Text('VERIFICAR', style: AppTypography.labelLarge.copyWith(color: AppColors.accent, fontSize: 12)),
            ),
        ],
      ),
    );
  }
}

class _PublicInfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _PublicInfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
        ),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
            const SizedBox(height: 2),
            Text(value.isNotEmpty ? value : '—', style: AppTypography.bodyLarge, maxLines: 2, overflow: TextOverflow.ellipsis, softWrap: true),
          ],
        ),
      ),
    );
  }
}

class _HoursPreview extends StatelessWidget {
  final List<OpeningHour> hours;
  const _HoursPreview({required this.hours});

  @override
  Widget build(BuildContext context) {
    final openDays = hours.where((h) => !h.isClosed).toList();
    final dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
        ),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Horarios', style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
            const SizedBox(height: 4),
            if (openDays.isEmpty)
              Text('Sin horarios configurados', style: AppTypography.bodyLarge)
            else
              ...openDays.map((h) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    SizedBox(width: 40, child: Text(dayNames[h.dayOfWeek], style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
                    const SizedBox(width: AppSpacing.s),
                    Expanded(child: Text('${h.openTime} — ${h.closeTime}', style: AppTypography.bodyLarge, maxLines: 1, overflow: TextOverflow.ellipsis, softWrap: true)),
                  ],
                ),
              )),
          ],
        ),
      ),
    );
  }
}
