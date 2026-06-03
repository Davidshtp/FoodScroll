import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/onboarding_navigation.dart';
import '../../../models/delivery_profile_model.dart';
import '../../../services/delivery_service.dart';
import '../../../services/customer_service.dart';
import '../../../services/restaurant_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_dropdown_field.dart';
import '../../components/custom_text_field.dart';
import '../../components/primary_button.dart';
import '../../components/futuristic_background.dart';
import '../../components/app_logo.dart';

class DeliveryProfilePage extends ConsumerStatefulWidget {
  const DeliveryProfilePage({super.key});

  @override
  ConsumerState<DeliveryProfilePage> createState() => _DeliveryProfilePageState();
}

class _DeliveryProfilePageState extends ConsumerState<DeliveryProfilePage> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _documentNumberController = TextEditingController();
  final _birthDateController = TextEditingController();

  DateTime? _birthDate;
  String? _gender;
  String? _documentType;
  String? _vehicleType;
  bool _isSubmitting = false;
  Map<String, String> _errors = {};

  static const List<String> _genderOptions = [
    'HOMBRE',
    'MUJER',
    'OTRO',
    'PREFIERO_NO_DECIRLO',
  ];

  static const List<String> _documentTypeOptions = [
    'CC',
    'CE',
    'PASSPORT',
  ];

  static const List<String> _vehicleTypeOptions = [
    'BICICLETA',
    'MOTO',
    'CARRO',
    'A_PIE',
  ];

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _documentNumberController.dispose();
    _birthDateController.dispose();
    super.dispose();
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final initialDate = _birthDate ?? DateTime(now.year - 18, now.month, now.day);

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1900),
      lastDate: now,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: AppColors.primary,
                  onPrimary: Colors.white,
                  surface: AppColors.surface,
                  onSurface: Colors.white,
                ),
            dialogTheme: Theme.of(context).dialogTheme.copyWith(
                  backgroundColor: AppColors.surface,
                ),
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );

    if (picked == null) return;

    setState(() {
      _birthDate = picked;
      _birthDateController.text = _formatDate(picked);
      _errors.remove('birthDate');
    });
  }

  String _formatDate(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  bool _validateForm() {
    final errors = <String, String>{};

    if (_firstNameController.text.trim().isEmpty) {
      errors['firstName'] = 'Ingresa tu nombre';
    }
    if (_lastNameController.text.trim().isEmpty) {
      errors['lastName'] = 'Ingresa tu apellido';
    }

    final phoneDigits = _sanitizePhone(_phoneController.text);
    if (!RegExp(r'^3\d{9}$').hasMatch(phoneDigits)) {
      errors['phone'] = 'Debe tener 10 dígitos y comenzar con 3';
    }

    if (_documentType == null) {
      errors['documentType'] = 'Selecciona un tipo';
    }
    if (_documentNumberController.text.trim().isEmpty) {
      errors['documentNumber'] = 'Ingresa tu documento';
    }
    if (_birthDate == null) {
      errors['birthDate'] = 'Selecciona tu fecha de nacimiento';
    }
    if (_gender == null) {
      errors['gender'] = 'Selecciona un género';
    }
    if (_vehicleType == null) {
      errors['vehicleType'] = 'Selecciona tu vehículo';
    }

    setState(() => _errors = errors);
    return errors.isEmpty;
  }

  String _sanitizePhone(String value) => value.replaceAll(RegExp(r'\D'), '');

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

  Future<void> _submit() async {
    if (_isSubmitting) return;
    if (!_validateForm()) {
      _showSnack('Revisa los campos marcados');
      return;
    }

    setState(() => _isSubmitting = true);

    final payload = DeliveryProfilePayload(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      phone: _sanitizePhone(_phoneController.text),
      documentType: _documentType!,
      documentNumber: _documentNumberController.text.trim(),
      birthDate: _birthDateController.text.trim(),
      gender: _gender!,
      vehicleType: _vehicleType!,
    );

    try {
      await ref.read(deliveryServiceProvider).createProfile(payload);
      if (!mounted) return;

      await ref.read(authServiceProvider).fetchMe();

      final route = await OnboardingNavigation.resolvePostAuthRoute(
        user: null,
        customerService: ref.read(customerServiceProvider),
        authService: ref.read(authServiceProvider),
        deliveryService: ref.read(deliveryServiceProvider),
        restaurantService: ref.read(restaurantServiceProvider),
      );

      if (mounted) context.go(route);
    } on DeliveryProfileException catch (e) {
      if (mounted) _showSnack(e.messages.isNotEmpty ? e.messages.join('\n') : e.message);
    } catch (_) {
      if (mounted) _showSnack('Ocurrió un error, intenta nuevamente');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              const Center(child: AppLogo(size: 56)),
                const SizedBox(height: 12),
                Text(
                  'Perfil de Repartidor',
                  style: AppTypography.headlineMedium.copyWith(
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Necesitamos tus datos para continuar',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                CustomTextField(
                  label: 'Nombre',
                  controller: _firstNameController,
                  errorText: _errors['firstName'],
                  hintText: 'Tu nombre',
                ),
                const SizedBox(height: AppSpacing.m),
                CustomTextField(
                  label: 'Apellido',
                  controller: _lastNameController,
                  errorText: _errors['lastName'],
                  hintText: 'Tu apellido',
                ),
                const SizedBox(height: AppSpacing.m),
                CustomTextField(
                  label: 'Teléfono',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(10),
                  ],
                  errorText: _errors['phone'],
                  hintText: '3000000000',
                ),
                const SizedBox(height: AppSpacing.m),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: CustomDropdownField(
                        label: 'Tipo Doc.',
                        value: _documentType,
                        items: _documentTypeOptions,
                        hintText: 'Tipo',
                        errorText: _errors['documentType'],
                        onChanged: (v) {
                          setState(() {
                            _documentType = v;
                            _errors.remove('documentType');
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 3,
                      child: CustomTextField(
                        label: 'N° Documento',
                        controller: _documentNumberController,
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        errorText: _errors['documentNumber'],
                        hintText: '123456789',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.m),
                CustomTextField(
                  label: 'Fecha de nacimiento',
                  controller: _birthDateController,
                  readOnly: true,
                  onTap: _pickBirthDate,
                  suffixIcon: Icons.calendar_month,
                  onSuffixIconPressed: _pickBirthDate,
                  errorText: _errors['birthDate'],
                  hintText: 'YYYY-MM-DD',
                ),
                const SizedBox(height: AppSpacing.m),
                CustomDropdownField(
                  label: 'Género',
                  value: _gender,
                  items: _genderOptions,
                  hintText: 'Selecciona una opción',
                  errorText: _errors['gender'],
                  onChanged: (v) {
                    setState(() {
                      _gender = v;
                      _errors.remove('gender');
                    });
                  },
                ),
                const SizedBox(height: AppSpacing.m),
                _buildVehicleSelector(),
                if (_errors['vehicleType'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4, left: 16),
                    child: Text(
                      _errors['vehicleType']!,
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.error, fontSize: 12),
                    ),
                  ),
                const SizedBox(height: AppSpacing.xl),
                PrimaryButton(
                  label: 'Guardar y continuar',
                  onPressed: _submit,
                  isLoading: _isSubmitting,
                ),
                const SizedBox(height: AppSpacing.l),
              ],
            ),
          ),
        ),
    );
  }

  Widget _buildVehicleSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, bottom: 8.0),
          child: Text(
            'TIPO DE VEHÍCULO',
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.textInputLabel,
              letterSpacing: 1.5,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Row(
          children: _vehicleTypeOptions.map((type) {
            final selected = _vehicleType == type;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _vehicleType = type;
                    _errors.remove('vehicleType');
                  });
                },
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.inputBackground,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: selected ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        _vehicleIcon(type),
                        color: selected ? Colors.white : AppColors.textSecondary,
                        size: 22,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _vehicleLabel(type),
                        style: AppTypography.labelSmall.copyWith(
                          color: selected ? Colors.white : AppColors.textSecondary,
                          fontWeight: FontWeight.w700,
                          fontSize: 9,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  IconData _vehicleIcon(String type) {
    switch (type) {
      case 'BICICLETA':
        return Icons.pedal_bike;
      case 'MOTO':
        return Icons.motorcycle;
      case 'CARRO':
        return Icons.directions_car;
      case 'A_PIE':
        return Icons.directions_walk;
      default:
        return Icons.help_outline;
    }
  }

  String _vehicleLabel(String type) {
    switch (type) {
      case 'BICICLETA':
        return 'BICI';
      case 'MOTO':
        return 'MOTO';
      case 'CARRO':
        return 'CARRO';
      case 'A_PIE':
        return 'A PIE';
      default:
        return type;
    }
  }
}
