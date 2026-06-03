import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/onboarding_navigation.dart';
import '../../../services/delivery_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/primary_button.dart';
import '../../components/futuristic_background.dart';
import '../../components/app_logo.dart';

class AddLicensePage extends ConsumerStatefulWidget {
  const AddLicensePage({super.key});

  @override
  ConsumerState<AddLicensePage> createState() => _AddLicensePageState();
}

class _AddLicensePageState extends ConsumerState<AddLicensePage> {
  XFile? _licenseImage;
  bool _isSubmitting = false;

  void _onCancel() {
    OnboardingNavigation.confirmCancel(
      context,
      onConfirm: () async {
        await ref.read(authControllerProvider.notifier).logout();
        if (!mounted) return;
        await ref.read(authServiceProvider).clearClientType();
        if (!mounted) return;
        context.go('/');
      },
    );
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery);
    if (file != null) {
      setState(() => _licenseImage = file);
    }
  }

  Future<void> _submit() async {
    if (_licenseImage == null) {
      _showError('Selecciona una imagen de la licencia de conducción');
      return;
    }

    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    try {
      await ref.read(deliveryServiceProvider).verifyLicense(
            imagePath: _licenseImage!.path,
          );
      if (!mounted) return;

      await ref.read(authServiceProvider).fetchMe();

      if (mounted) {
        _showSuccess('Licencia verificada correctamente');
        context.go('/home');
      }
    } on DeliveryProfileException catch (e) {
      if (mounted) _showError(e.message);
    } catch (_) {
      if (mounted) _showError('Ocurrió un error, intenta nuevamente');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.error),
    );
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.success),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: _onCancel,
        ),
      ),
      body: FuturisticBackground(
        child: SafeArea(
          child: Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 40),
                    const Center(child: AppLogo(size: 50)),
                    const SizedBox(height: 12),
                    Text(
                      'Licencia de Conducir',
                      style: AppTypography.headlineMedium.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 24,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sube una foto de tu licencia para verificarla',
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    _buildImagePickerCard(
                      label: 'Licencia de Conducir',
                      file: _licenseImage,
                      onTap: _pickImage,
                      required: true,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    PrimaryButton(
                      label: 'Verificar licencia',
                      onPressed: _submit,
                      isLoading: _isSubmitting,
                    ),
                    const SizedBox(height: AppSpacing.l),
                  ],
                ),
              ),
              if (_isSubmitting)
                _buildLoadingOverlay('Verificando licencia...\nConsultando con RUNT'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingOverlay(String message) {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 48,
              height: 48,
              child: CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 4,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTypography.bodyLarge.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePickerCard({
    required String label,
    required XFile? file,
    required VoidCallback onTap,
    required bool required,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 180,
        decoration: BoxDecoration(
          color: AppColors.inputBackground,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: file != null ? AppColors.success : AppColors.border,
            width: 1.5,
          ),
        ),
        child: file != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.file(
                      File(file.path),
                      fit: BoxFit.cover,
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '✓',
                          style: AppTypography.labelSmall.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.drive_file_rename_outline, color: AppColors.textSecondary, size: 44),
                  const SizedBox(height: 8),
                  Text(
                    'TAP PARA SELECCIONAR',
                    style: AppTypography.labelLarge.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    required ? '$label *' : label,
                    style: AppTypography.labelSmall.copyWith(
                      color: required ? AppColors.primary : AppColors.textTertiary,
                      fontSize: 10,
                      fontWeight: required ? FontWeight.w700 : FontWeight.normal,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
