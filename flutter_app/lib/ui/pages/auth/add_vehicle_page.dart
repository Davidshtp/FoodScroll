import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/onboarding_navigation.dart';
import '../../../services/delivery_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_dropdown_field.dart';
import '../../components/custom_text_field.dart';
import '../../components/primary_button.dart';
import '../../components/futuristic_background.dart';
import '../../components/app_logo.dart';

class AddVehiclePage extends ConsumerStatefulWidget {
  const AddVehiclePage({super.key});

  @override
  ConsumerState<AddVehiclePage> createState() => _AddVehiclePageState();
}

class _AddVehiclePageState extends ConsumerState<AddVehiclePage> {
  final _plateController = TextEditingController();
  final _documentNumberController = TextEditingController();

  String? _documentType;
  XFile? _vehicleImage;
  bool _isOCR = true;
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

  static const List<String> _documentTypeOptions = ['CC', 'CE', 'PASSPORT'];

  @override
  void dispose() {
    _plateController.dispose();
    _documentNumberController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery);
    if (file != null) {
      setState(() => _vehicleImage = file);
    }
  }

  Future<void> _submitWithImage() async {
    if (_vehicleImage == null) {
      _showError('Selecciona una imagen de la tarjeta de propiedad');
      return;
    }
    if (_isSubmitting) return;

    setState(() => _isSubmitting = true);

    try {
      final result = await ref.read(deliveryServiceProvider).registerVehicle(
            imagePath: _vehicleImage!.path,
          );
      if (!mounted) return;

      await ref.read(authServiceProvider).fetchMe();

      if (mounted) {
        if (result.status.canWork) {
          _showSuccess('Vehículo registrado correctamente');
          context.go('/home');
        } else {
          _showSuccess(result.message);
          context.go('/add-license');
        }
      }
    } on DeliveryProfileException catch (e) {
      if (mounted) _showError(e.message);
    } catch (_) {
      if (mounted) _showError('Ocurrió un error, intenta nuevamente');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _submitManual() async {
    final errors = <String>[];

    if (_plateController.text.trim().isEmpty) {
      errors.add('Ingresa la placa');
    }
    if (_documentType == null) {
      errors.add('Selecciona el tipo de documento');
    }
    if (_documentNumberController.text.trim().isEmpty) {
      errors.add('Ingresa el número de documento');
    }

    if (errors.isNotEmpty) {
      _showError(errors.join('\n'));
      return;
    }

    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    try {
      final result = await ref.read(deliveryServiceProvider).registerVehicleManual(
            plate: _plateController.text.trim().toUpperCase(),
            documentType: _documentType!,
            documentNumber: _documentNumberController.text.trim(),
          );
      if (!mounted) return;

      await ref.read(authServiceProvider).fetchMe();

      if (mounted) {
        if (result.status.canWork) {
          _showSuccess('Vehículo registrado correctamente');
          context.go('/home');
        } else {
          _showSuccess(result.message);
          context.go('/add-license');
        }
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
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.success,
      ),
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
        actions: [
          GestureDetector(
            onTap: () => setState(() => _isOCR = !_isOCR),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary, width: 1),
              ),
              child: Text(
                _isOCR ? 'MANUAL' : 'OCR',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                  fontSize: 10,
                ),
              ),
            ),
          ),
        ],
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
                      _isOCR ? 'Registrar Vehículo' : 'Registro Manual',
                      style: AppTypography.headlineMedium.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 24,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isOCR
                          ? 'Toma o selecciona la tarjeta de propiedad'
                          : 'Ingresa los datos del vehículo',
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    if (_isOCR) ...[
                      GestureDetector(
                        onTap: _pickImage,
                        child: Container(
                          height: 200,
                          decoration: BoxDecoration(
                            color: AppColors.inputBackground,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: _vehicleImage != null ? AppColors.success : AppColors.border,
                              width: 1.5,
                            ),
                          ),
                          child: _vehicleImage != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(24),
                                  child: Image.file(
                                    File(_vehicleImage!.path),
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                  ),
                                )
                              : Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.camera_alt, color: AppColors.textSecondary, size: 48),
                                    const SizedBox(height: 12),
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
                                      'Tarjeta de propiedad',
                                      style: AppTypography.labelSmall.copyWith(
                                        color: AppColors.textTertiary,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_vehicleImage != null)
                        Center(
                          child: Text(
                            '✓ Imagen seleccionada',
                            style: AppTypography.labelSmall.copyWith(
                              color: AppColors.success,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      const SizedBox(height: AppSpacing.l),
                      PrimaryButton(
                        label: 'Escanear y registrar',
                        onPressed: _submitWithImage,
                        isLoading: _isSubmitting,
                      ),
                    ] else ...[
                      CustomTextField(
                        label: 'Placa',
                        controller: _plateController,
                        hintText: 'ABC123',
                        inputFormatters: [
                          UpperCaseTextFormatter(),
                          LengthLimitingTextInputFormatter(6),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.m),
                      CustomDropdownField(
                        label: 'Tipo Doc. propietario',
                        value: _documentType,
                        items: _documentTypeOptions,
                        hintText: 'Tipo',
                        onChanged: (v) => setState(() => _documentType = v),
                      ),
                      const SizedBox(height: AppSpacing.m),
                      CustomTextField(
                        label: 'N° Documento propietario',
                        controller: _documentNumberController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        hintText: '123456789',
                      ),
                      const SizedBox(height: AppSpacing.l),
                      PrimaryButton(
                        label: 'Registrar vehículo',
                        onPressed: _submitManual,
                        isLoading: _isSubmitting,
                      ),
                    ],
                    const SizedBox(height: AppSpacing.l),
                  ],
                ),
              ),
              if (_isSubmitting)
                _buildLoadingOverlay('Procesando imagen...\nVerificando con RUNT'),
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
}

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(text: newValue.text.toUpperCase());
  }
}
