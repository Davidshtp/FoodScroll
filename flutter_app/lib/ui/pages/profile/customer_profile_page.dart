import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import '../../../models/address_model.dart';
import '../../../models/customer_profile_model.dart';
import '../../../services/address_service.dart';
import '../../../models/user_model.dart';
import '../../../services/customer_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_text_field.dart';
import '../../components/futuristic_background.dart';
import '../../components/primary_button.dart';
import 'edit_profile_sheet.dart';

class CustomerProfilePage extends ConsumerStatefulWidget {
  final VoidCallback? onAddressesChanged;

  const CustomerProfilePage({super.key, this.onAddressesChanged});

  @override
  ConsumerState<CustomerProfilePage> createState() => _CustomerProfilePageState();
}

class _CustomerProfilePageState extends ConsumerState<CustomerProfilePage> {
  CustomerProfile? _profile;
  AuthUser? _authUser;
  List<CustomerAddress> _addresses = [];
  bool _isLoading = true;


  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final auth = ref.read(authServiceProvider);
      final me = await auth.fetchMe();

      final customerService = ref.read(customerServiceProvider);
      final profile = await customerService.fetchProfile();
      final addressService = ref.read(addressServiceProvider);
      final addresses = await addressService.fetchAddresses();

      if (mounted) {
        setState(() {
          _profile = profile;
          _authUser = me;
          _addresses = addresses;
          _isLoading = false;
        });
        widget.onAddressesChanged?.call();
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showPhotoOptions() async {
    final hasPhoto = _profile?.avatarUrl != null && _profile!.avatarUrl!.isNotEmpty;

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
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textTertiary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.white70),
              title: const Text('Tomar foto',
                  style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.white70),
              title: const Text('Elegir de galería',
                  style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            if (hasPhoto) ...[
              const Divider(height: 1, color: AppColors.border),
              ListTile(
                leading: const Icon(Icons.delete_outline,
                    color: AppColors.error),
                title: const Text('Eliminar foto',
                    style: TextStyle(color: AppColors.error)),
                onTap: () {
                  Navigator.pop(ctx);
                  _confirmDeletePhoto();
                },
              ),
            ],
          ],
        ),
      ),
    );

    if (source == null) return;

    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (picked != null && mounted) {
      try {
        final bytes = await picked.readAsBytes();
        final name = picked.name;
        final service = ref.read(customerServiceProvider);
        await service.updateAvatar(bytes, name);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Foto actualizada')),
          );
          _loadData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }

  Future<void> _confirmDeletePhoto() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Eliminar foto'),
        content: const Text('¿Estás seguro de eliminar tu foto de perfil?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Eliminar',
                style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final service = ref.read(customerServiceProvider);
      await service.deleteAvatar();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Foto eliminada')),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _editField(String field) async {
    if (field == 'gender') {
      String? selected = _profile?.gender;
      await showModalBottomSheet(
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
              Text('Género', style: AppTypography.titleLarge),
              const SizedBox(height: 8),
              ...['HOMBRE', 'MUJER', 'OTRO', 'PREFIERO_NO_DECIRLO'].map((g) => ListTile(
                title: Text(g, style: AppTypography.bodyLarge),
                trailing: selected == g ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  Navigator.pop(ctx);
                  _saveProfile({'gender': g});
                },
              )),
            ],
          ),
        ),
      );
      return;
    }

    if (field == 'birthDate') {
      final now = DateTime.now();
      final picked = await showDatePicker(
        context: context,
        initialDate: DateTime.tryParse(_profile?.birthDate ?? '') ?? DateTime(now.year - 18),
        firstDate: DateTime(1900),
        lastDate: now,
        builder: (ctx, child) => Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: Theme.of(ctx).colorScheme.copyWith(primary: AppColors.primary, surface: AppColors.surface),
            dialogTheme: Theme.of(ctx).dialogTheme.copyWith(backgroundColor: AppColors.surface),
          ),
          child: child!,
        ),
      );
      if (picked != null) {
        final formatted = '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
        _saveProfile({'birthDate': formatted});
      }
      return;
    }

    final label = _fieldLabel(field);
    final hint = _fieldHint(field);
    final initial = _fieldValue(field);

    final controller = TextEditingController(text: initial);

    await EditProfileSheet.show(
      context,
      title: label,
      fields: [
        CustomTextField(
          label: label,
          controller: controller,
          hintText: hint,
          keyboardType: field == 'phone' ? TextInputType.phone : TextInputType.text,
          inputFormatters: field == 'phone' ? [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)] : null,
        ),
      ],
      onSave: () => _saveProfile({field: controller.text.trim()}),
    );

    controller.dispose();
  }

  String _fieldLabel(String field) {
    switch (field) {
      case 'firstName': return 'Nombre';
      case 'lastName': return 'Apellido';
      case 'phone': return 'Teléfono';
      default: return field;
    }
  }

  String _fieldHint(String field) {
    switch (field) {
      case 'firstName': return 'Tu nombre';
      case 'lastName': return 'Tu apellido';
      case 'phone': return '3000000000';
      default: return '';
    }
  }

  String _fieldValue(String field) {
    switch (field) {
      case 'firstName': return _profile?.firstName ?? '';
      case 'lastName': return _profile?.lastName ?? '';
      case 'phone': return _profile?.phone ?? '';
      default: return '';
    }
  }

  Future<void> _saveProfile(Map<String, dynamic> data) async {
    try {
      final service = ref.read(customerServiceProvider);
      final p = _profile;
      final payload = CustomerProfilePayload(
        firstName: (data['firstName'] ?? p?.firstName ?? '') as String,
        lastName: (data['lastName'] ?? p?.lastName ?? '') as String,
        phone: (data['phone'] ?? p?.phone ?? '') as String,
        birthDate: (data['birthDate'] ?? p?.birthDate ?? '') as String,
        gender: (data['gender'] ?? p?.gender ?? '') as String,
      );
      final updated = await service.updateProfile(payload);
      if (mounted) {
        setState(() => _profile = updated);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Perfil actualizado')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
    }
  }

  Future<void> _deleteAddress(String addressId, String alias) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Eliminar dirección'),
        content: Text('¿Eliminar "$alias"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(addressServiceProvider).deleteAddress(addressId);
      if (mounted) {
        setState(() => _addresses.removeWhere((a) => a.id == addressId));
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Dirección eliminada')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
    }
  }

  Future<void> _editAddress(CustomerAddress address) async {
    final aliasCtrl = TextEditingController(text: address.alias);
    final neighborhoodCtrl = TextEditingController(text: address.neighborhood);
    final detailsCtrl = TextEditingController(text: address.details ?? '');

    await EditProfileSheet.show(
      context,
      title: 'Editar dirección',
      fields: [
        CustomTextField(label: 'Alias', controller: aliasCtrl, hintText: 'Casa, trabajo'),
        const SizedBox(height: AppSpacing.m),
        Container(
          padding: const EdgeInsets.all(AppSpacing.m),
          decoration: BoxDecoration(color: AppColors.inputBackground, borderRadius: BorderRadius.circular(30)),
          child: Row(
            children: [
              const Icon(Icons.location_on, color: AppColors.textTertiary, size: 16),
              const SizedBox(width: AppSpacing.s),
              Expanded(child: Text(address.mainAddress, style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary))),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.m),
        CustomTextField(label: 'Barrio', controller: neighborhoodCtrl, hintText: 'Barrio'),
        const SizedBox(height: AppSpacing.m),
        CustomTextField(label: 'Detalles', controller: detailsCtrl, hintText: 'Apto 502'),
      ],
      onSave: () async {
        try {
          final payload = AddressUpdatePayload(
            alias: aliasCtrl.text.trim().isEmpty ? null : aliasCtrl.text.trim(),
            neighborhood: neighborhoodCtrl.text.trim().isEmpty ? null : neighborhoodCtrl.text.trim(),
            details: detailsCtrl.text.trim().isEmpty ? null : detailsCtrl.text.trim(),
          );
          final updated = await ref.read(addressServiceProvider).updateAddress(address.id, payload);
          if (mounted) {
            setState(() {
              final idx = _addresses.indexWhere((a) => a.id == address.id);
              if (idx >= 0) _addresses[idx] = updated;
            });
          }
        } catch (e) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
        }
      },
    );

    aliasCtrl.dispose();
    neighborhoodCtrl.dispose();
    detailsCtrl.dispose();
  }

  Future<void> _onVerifyEmail() async {
    await context.push('/verify-email');
    if (mounted) _loadData();
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
    if (_isLoading) {
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

    final fullName = '${profile.firstName} ${profile.lastName}';
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
                GestureDetector(
                  onTap: _showPhotoOptions,
                  child: ClipOval(
                    child: SizedBox(
                      width: 88, height: 88,
                      child: profile.avatarUrl != null && profile.avatarUrl!.isNotEmpty
                          ? CachedNetworkImage(imageUrl: profile.avatarUrl!, fit: BoxFit.cover,
                              placeholder: (context, url) => Container(color: AppColors.surfaceHighlight),
                              errorWidget: (context, url, error) => Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.person, color: AppColors.textSecondary, size: 40)))
                          : Container(color: AppColors.surfaceHighlight, child: const Icon(Icons.person, color: AppColors.textSecondary, size: 40)),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(fullName, style: AppTypography.titleLarge),
                const SizedBox(height: AppSpacing.xs),
                Text(_authUser?.email ?? '', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.m),
          _VerificationBanner(isVerified: isVerified, onVerifyTap: _onVerifyEmail),
          const SizedBox(height: AppSpacing.l),
          Text('INFORMACIÓN PERSONAL', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
          const SizedBox(height: AppSpacing.s),
          _InfoRow(label: 'Nombre', value: profile.firstName, onTap: () => _editField('firstName')),
          _InfoRow(label: 'Apellido', value: profile.lastName, onTap: () => _editField('lastName')),
          _InfoRow(label: 'Teléfono', value: profile.phone, onTap: () => _editField('phone')),
          _InfoRow(label: 'Fecha de nacimiento', value: profile.birthDate ?? '', onTap: () => _editField('birthDate')),
          _InfoRow(label: 'Género', value: profile.gender ?? '', onTap: () => _editField('gender')),
          const SizedBox(height: AppSpacing.l),
          Text('DIRECCIONES', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
          const SizedBox(height: AppSpacing.s),
          ..._addresses.map((addr) => _AddressCard(address: addr, onEdit: () => _editAddress(addr), onDelete: () => _deleteAddress(addr.id, addr.alias))),
          const SizedBox(height: AppSpacing.s),
          OutlinedButton.icon(
            onPressed: () async {
              await context.push('/profile-add-address');
              if (mounted) _loadData();
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.textPrimary,
              side: BorderSide(color: AppColors.cardOutline.withValues(alpha: 0.4)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
            ),
            icon: const Icon(Icons.add, size: 18),
            label: Text('Añadir dirección', style: AppTypography.labelLarge),
          ),
          const SizedBox(height: AppSpacing.xl),
          PrimaryButton(label: 'Cerrar sesión', onPressed: _logout),
          const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _VerificationBanner extends StatelessWidget {
  final bool isVerified;
  final VoidCallback? onVerifyTap;
  const _VerificationBanner({required this.isVerified, this.onVerifyTap});

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

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;

  const _InfoRow({required this.label, required this.value, required this.onTap});

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
                      Text(value.isNotEmpty ? value : '—', style: AppTypography.bodyLarge),
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

class _AddressCard extends StatelessWidget {
  final CustomerAddress address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _AddressCard({required this.address, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.m),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
        ),
        padding: const EdgeInsets.all(AppSpacing.m),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on, color: AppColors.primary, size: 18),
                const SizedBox(width: AppSpacing.xs),
                Expanded(child: Text(address.alias, style: AppTypography.titleMedium.copyWith(fontSize: 15))),
                IconButton(icon: const Icon(Icons.edit, color: AppColors.textTertiary, size: 18), onPressed: onEdit, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
                const SizedBox(width: AppSpacing.s),
                IconButton(icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 18), onPressed: onDelete, padding: EdgeInsets.zero, constraints: const BoxConstraints()),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(address.mainAddress, style: AppTypography.bodyMedium),
            Text('${address.neighborhood}${address.details != null && address.details!.isNotEmpty ? ' - ${address.details}' : ''}',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
          ],
        ),
      ),
    );
  }
}
