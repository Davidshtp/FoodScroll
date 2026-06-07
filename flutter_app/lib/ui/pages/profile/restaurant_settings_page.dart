import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../models/user_model.dart';
import '../../../services/restaurant_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_text_field.dart';
import '../../components/futuristic_background.dart';
import '../../components/primary_button.dart';
import 'edit_profile_sheet.dart';

class RestaurantSettingsPage extends ConsumerStatefulWidget {
  const RestaurantSettingsPage({super.key});

  @override
  ConsumerState<RestaurantSettingsPage> createState() => _RestaurantSettingsPageState();
}

class _RestaurantSettingsPageState extends ConsumerState<RestaurantSettingsPage> {
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

  Future<void> _showPhotoOptions() async {
    final hasPhoto = _profile?.logoUrl != null && _profile!.logoUrl!.isNotEmpty;

    final source = await showModalBottomSheet<ImageSource>(
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
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.white70),
              title: const Text('Tomar foto', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.white70),
              title: const Text('Elegir de galería', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            if (hasPhoto) ...[
              const Divider(height: 1, color: AppColors.border),
              ListTile(
                leading: const Icon(Icons.delete_outline, color: AppColors.error),
                title: const Text('Eliminar logo', style: TextStyle(color: AppColors.error)),
                onTap: () { Navigator.pop(ctx); _confirmDeletePhoto(); },
              ),
            ],
          ],
        ),
      ),
    );

    if (source == null) return;

    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, maxWidth: 1024, maxHeight: 1024, imageQuality: 85);

    if (picked != null && mounted) {
      try {
        final bytes = await picked.readAsBytes();
        final name = picked.name;
        final service = ref.read(restaurantServiceProvider);
        await service.updateLogo(bytes, name);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Logo actualizado')));
          _loadData();
        }
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    }
  }

  Future<void> _confirmDeletePhoto() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Eliminar logo'),
        content: const Text('¿Estás seguro de eliminar el logo?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final service = ref.read(restaurantServiceProvider);
      await service.deleteLogo();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Logo eliminado')));
        _loadData();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
    }
  }

  Future<void> _editField(String field) async {
    final label = _fieldLabel(field);
    final controller = TextEditingController(text: _fieldValue(field));

    await EditProfileSheet.show(
      context,
      title: label,
      fields: [
        CustomTextField(label: label, controller: controller, hintText: label),
      ],
      onSave: () => _saveProfile({field: controller.text.trim()}),
    );

    controller.dispose();
  }

  String _fieldLabel(String field) {
    switch (field) {
      case 'name': return 'Nombre';
      case 'description': return 'Descripción';
      case 'phone': return 'Teléfono';
      case 'email': return 'Correo electrónico';
      default: return field;
    }
  }

  String _fieldValue(String field) {
    switch (field) {
      case 'name': return _profile?.name ?? '';
      case 'description': return _profile?.description ?? '';
      case 'phone': return _profile?.phone ?? '';
      case 'email': return _profile?.email ?? '';
      default: return '';
    }
  }

  Future<void> _saveProfile(Map<String, dynamic> data) async {
    setState(() => _isLoading = true);
    try {
      final service = ref.read(restaurantServiceProvider);
      final p = _profile!;
      final payload = RestaurantProfileUpdatePayload(
        name: data['name'] as String? ?? p.name,
        description: data['description'] as String? ?? p.description,
        phone: data['phone'] as String? ?? p.phone,
        email: data['email'] as String? ?? p.email,
      );
      final updated = await service.updateProfile(payload);
      if (mounted) {
        setState(() => _profile = updated);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Perfil actualizado')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Cerrar sesión'),
        content: const Text('¿Estás seguro de cerrar sesión?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Cerrar sesión', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(authServiceProvider).logout();
      await ref.read(authControllerProvider.notifier).logout();
      if (mounted) context.go('/');
    } catch (_) {
      if (mounted) context.go('/');
    }
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

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Configuración'),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      body: FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.m, AppSpacing.m, AppSpacing.m, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: _showPhotoOptions,
                      child: Stack(
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
                          Positioned(
                            bottom: 0, right: 0,
                            child: Container(
                              width: 32, height: 32,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(profile.name, style: AppTypography.titleLarge, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, softWrap: true),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.m),
              _VerificationBanner(isVerified: isVerified),
              const SizedBox(height: AppSpacing.l),
              Text('INFORMACIÓN DEL RESTAURANTE', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
              const SizedBox(height: AppSpacing.s),
              _SettingsRow(label: 'Nombre', value: profile.name, onTap: () => _editField('name')),
              _SettingsRow(label: 'Descripción', value: profile.description, onTap: () => _editField('description')),
              _SettingsRow(label: 'Teléfono', value: profile.phone, onTap: () => _editField('phone')),
              _SettingsRow(label: 'Correo', value: profile.email, onTap: () => _editField('email')),
              const SizedBox(height: AppSpacing.l),
              Text('UBICACIÓN Y HORARIOS', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
              const SizedBox(height: AppSpacing.s),
              _SettingsRow(
                label: 'Dirección',
                value: _address?.address ?? 'Sin dirección',
                onTap: () async {
                  await context.push('/restaurant-address');
                  if (mounted) _loadData();
                },
              ),
              _SettingsRow(
                label: 'Horarios',
                value: _openingHours.any((h) => !h.isClosed)
                    ? '${_openingHours.where((h) => !h.isClosed).length} días configurados'
                    : 'Sin configurar',
                onTap: () async {
                  await context.push('/opening-hours');
                  if (mounted) _loadData();
                },
              ),
              const SizedBox(height: AppSpacing.xl),
              PrimaryButton(label: 'Cerrar sesión', onPressed: _logout),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _VerificationBanner extends StatelessWidget {
  final bool isVerified;
  const _VerificationBanner({required this.isVerified});

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
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;

  const _SettingsRow({required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.m),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.m),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.m, vertical: AppSpacing.sm),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary)),
                      const SizedBox(height: 2),
                      Text(value.isNotEmpty ? value : '—', style: AppTypography.bodyLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.textTertiary, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
