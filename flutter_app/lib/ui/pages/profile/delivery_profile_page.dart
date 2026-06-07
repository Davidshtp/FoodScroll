import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import '../../../models/delivery_profile_model.dart';
import '../../../models/vehicle_details_model.dart';
import '../../../models/user_model.dart';
import '../../../services/delivery_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_text_field.dart';
import '../../components/futuristic_background.dart';
import '../../components/primary_button.dart';
import 'edit_profile_sheet.dart';

class DeliveryProfilePage extends ConsumerStatefulWidget {
  const DeliveryProfilePage({super.key});

  @override
  ConsumerState<DeliveryProfilePage> createState() => _DeliveryProfilePageState();
}

class _DeliveryProfilePageState extends ConsumerState<DeliveryProfilePage> {
  DeliveryProfile? _profile;
  AuthUser? _authUser;
  VehicleDetails? _vehicleDetails;
  bool _isLoading = true;
  bool _hasVehicle = false;
  bool _isDeletingVehicle = false;

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

      final deliveryService = ref.read(deliveryServiceProvider);
      final profile = await deliveryService.fetchProfile();

      VehicleDetails? vehicle;
      bool hasVehicle = false;
      try {
        vehicle = await deliveryService.fetchVehicle();
        hasVehicle = true;
      } on DeliveryProfileException catch (e) {
        if (e.statusCode != 404) rethrow;
      }

      if (mounted) {
        setState(() {
          _profile = profile;
          _authUser = me;
          _vehicleDetails = vehicle;
          _hasVehicle = hasVehicle;
          _isLoading = false;
        });
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
        final service = ref.read(deliveryServiceProvider);
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
      final service = ref.read(deliveryServiceProvider);
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

    if (field == 'vehicleType') {
      String? selected = _profile?.vehicleType;
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
              Text('Tipo de vehículo', style: AppTypography.titleLarge),
              const SizedBox(height: 8),
              ...['MOTO', 'CARRO', 'BICICLETA', 'OTRO'].map((v) => ListTile(
                title: Text(v, style: AppTypography.bodyLarge),
                trailing: selected == v ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  Navigator.pop(ctx);
                  _saveProfile({'vehicleType': v});
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

    final controller = TextEditingController(text: _fieldValue(field));

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
      case 'documentType': return 'Tipo de documento';
      case 'documentNumber': return 'Número de documento';
      default: return field;
    }
  }

  String _fieldHint(String field) {
    switch (field) {
      case 'firstName': return 'Tu nombre';
      case 'lastName': return 'Tu apellido';
      case 'phone': return '3000000000';
      case 'documentNumber': return '1234567890';
      default: return '';
    }
  }

  String _fieldValue(String field) {
    switch (field) {
      case 'firstName': return _profile?.firstName ?? '';
      case 'lastName': return _profile?.lastName ?? '';
      case 'phone': return _profile?.phone ?? '';
      case 'documentType': return _profile?.documentType ?? '';
      case 'documentNumber': return _profile?.documentNumber ?? '';
      default: return '';
    }
  }

  Future<void> _saveProfile(Map<String, dynamic> data) async {
    setState(() => _isLoading = true);
    try {
      final service = ref.read(deliveryServiceProvider);
      final p = _profile!;
      final payload = DeliveryProfileUpdatePayload(
        firstName: data['firstName'] as String? ?? p.firstName,
        lastName: data['lastName'] as String? ?? p.lastName,
        phone: data['phone'] as String? ?? p.phone,
        documentType: data['documentType'] as String? ?? p.documentType,
        documentNumber: data['documentNumber'] as String? ?? p.documentNumber,
        birthDate: data['birthDate'] as String? ?? p.birthDate,
        gender: data['gender'] as String? ?? p.gender,
        vehicleType: data['vehicleType'] as String? ?? p.vehicleType,
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

  Future<void> _deleteVehicle() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Eliminar vehículo'),
        content: const Text('¿Estás seguro de eliminar tu vehículo activo? Podrás agregar uno nuevo después.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isDeletingVehicle = true);
    try {
      await ref.read(deliveryServiceProvider).deleteVehicle();
      if (mounted) {
        setState(() {
          _hasVehicle = false;
          _vehicleDetails = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vehículo eliminado')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
    } finally {
      if (mounted) setState(() => _isDeletingVehicle = false);
    }
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

  String _soatStatusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'VIGENTE': return 'Vigente';
      case 'NO VIGENTE': return 'Vencido';
      case 'VENCIDO': return 'Vencido';
      default: return status;
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'VIGENTE':
      case 'APROBADA':
        return AppColors.success;
      case 'NO VIGENTE':
      case 'VENCIDO':
        return AppColors.error;
      default:
        return AppColors.warning;
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
                Text(fullName, style: AppTypography.titleLarge, maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
                const SizedBox(height: AppSpacing.xs),
                Text(_authUser?.email ?? '', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary), maxLines: 1, overflow: TextOverflow.ellipsis),
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
          _InfoRow(label: 'Tipo de documento', value: profile.documentType, onTap: () => _editField('documentType')),
          _InfoRow(label: 'Número de documento', value: profile.documentNumber, onTap: () => _editField('documentNumber')),
          _InfoRow(label: 'Fecha de nacimiento', value: profile.birthDate, onTap: () => _editField('birthDate')),
          _InfoRow(label: 'Género', value: profile.gender, onTap: () => _editField('gender')),
          _InfoRow(label: 'Tipo de vehículo', value: profile.vehicleType, onTap: () => _editField('vehicleType')),
          const SizedBox(height: AppSpacing.l),
          Text('VEHÍCULO ACTIVO', style: AppTypography.labelSmall.copyWith(color: AppColors.accent, letterSpacing: 1.5)),
          const SizedBox(height: AppSpacing.s),
          if (_hasVehicle && _vehicleDetails != null)
            _VehicleCard(
              vehicle: _vehicleDetails!.vehicle,
              soatStatus: _vehicleDetails!.soats.isNotEmpty ? _vehicleDetails!.soats.first : null,
              technoStatus: _vehicleDetails!.technos.isNotEmpty ? _vehicleDetails!.technos.firstWhere(
                (t) => t.isCurrent == 'SI',
                orElse: () => _vehicleDetails!.technos.first,
              ) : null,
              onDelete: _deleteVehicle,
              isDeleting: _isDeletingVehicle,
              statusColor: _statusColor,
              statusLabel: _soatStatusLabel,
            )
          else
            OutlinedButton.icon(
              onPressed: () async {
                await context.push('/add-vehicle');
                if (mounted) _loadData();
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textPrimary,
                side: BorderSide(color: AppColors.cardOutline.withValues(alpha: 0.4)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl)),
              ),
              icon: const Icon(Icons.add, size: 18),
              label: Text('Agregar vehículo', style: AppTypography.labelLarge),
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

class _VehicleCard extends StatelessWidget {
  final VehicleData vehicle;
  final SoatInfo? soatStatus;
  final TechnoInfo? technoStatus;
  final VoidCallback onDelete;
  final bool isDeleting;
  final Color Function(String) statusColor;
  final String Function(String) statusLabel;

  const _VehicleCard({
    required this.vehicle,
    this.soatStatus,
    this.technoStatus,
    required this.onDelete,
    required this.isDeleting,
    required this.statusColor,
    required this.statusLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
              const Icon(Icons.two_wheeler, color: AppColors.primary, size: 22),
              const SizedBox(width: AppSpacing.s),
              Expanded(child: Text('${vehicle.brand} ${vehicle.line}', style: AppTypography.titleMedium.copyWith(fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis)),
              if (isDeleting)
                const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              else
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 18),
                  onPressed: onDelete,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.s),
          _DetailRow(label: 'Placa', value: vehicle.plate),
          _DetailRow(label: 'Color', value: vehicle.color),
          _DetailRow(label: 'Modelo', value: vehicle.modelYear.toString()),
          if (soatStatus != null) ...[
            const SizedBox(height: AppSpacing.xs),
            _StatusRow(label: 'SOAT', status: statusLabel(soatStatus!.status), color: statusColor(soatStatus!.status)),
          ],
          if (technoStatus != null) ...[
            const SizedBox(height: AppSpacing.xs),
            _StatusRow(label: 'Tecnomecánica', status: statusLabel(technoStatus!.status), color: statusColor(technoStatus!.status)),
          ],
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary))),
          Expanded(child: Text(value, style: AppTypography.bodyMedium, maxLines: 2, overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final String label;
  final String status;
  final Color color;
  const _StatusRow({required this.label, required this.status, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary))),
          Row(
            children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: AppSpacing.xs),
              Text(status, style: AppTypography.bodyMedium.copyWith(color: color)),
            ],
          ),
        ],
      ),
    );
  }
}
