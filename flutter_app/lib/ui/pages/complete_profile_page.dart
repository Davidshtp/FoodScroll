import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/onboarding_navigation.dart';
import '../../models/customer_profile_model.dart';
import '../../services/customer_service.dart';
import '../../services/delivery_service.dart';
import '../../services/restaurant_service.dart';
import '../../state/auth_provider.dart';
import '../../theme/app_spacing.dart';
import '../components/custom_dropdown_field.dart';
import '../components/custom_text_field.dart';
import '../components/profile_avatar_picker.dart';
import '../layouts/complete_profile_layout.dart';

class CompleteProfilePage extends ConsumerStatefulWidget {
  final bool isEditing;
  final Map<String, dynamic>? initialProfile;

  const CompleteProfilePage({
    super.key,
    this.isEditing = false,
    this.initialProfile,
  });

  @override
  ConsumerState<CompleteProfilePage> createState() =>
      _CompleteProfilePageState();
}

class _CompleteProfilePageState extends ConsumerState<CompleteProfilePage> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _birthDateController = TextEditingController();

  DateTime? _birthDate;
  String? _gender;
  bool _isSubmitting = false;
  Map<String, String> _errors = {};

  static const List<String> _genderOptions = [
    'HOMBRE',
    'MUJER',
    'OTRO',
    'PREFIERO_NO_DECIRLO',
  ];

  @override
  void initState() {
    super.initState();
    _applyInitialData();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _birthDateController.dispose();
    super.dispose();
  }

  void _applyInitialData() {
    final data = widget.initialProfile;
    if (data == null) return;

    _firstNameController.text = (data['firstName'] ?? '').toString();
    _lastNameController.text = (data['lastName'] ?? '').toString();
    _phoneController.text = (data['phone'] ?? '').toString();

    final birthDate = data['birthDate'];
    if (birthDate is String && birthDate.isNotEmpty) {
      _birthDateController.text = birthDate;
      _birthDate = DateTime.tryParse(birthDate);
    }

    final gender = data['gender'];
    if (gender is String && _genderOptions.contains(gender)) {
      _gender = gender;
    }
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
        final theme = Theme.of(context);
        return Theme(
          data: theme.copyWith(
            colorScheme: theme.colorScheme.copyWith(
              primary: theme.colorScheme.primary,
              onPrimary: Colors.white,
              surface: theme.colorScheme.surface,
              onSurface: Colors.white,
            ),
            dialogTheme: theme.dialogTheme.copyWith(
              backgroundColor: theme.colorScheme.surface,
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
    final year = date.year.toString().padLeft(4, '0');
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
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
      errors['phone'] = 'Debe tener 10 digitos y comenzar con 3';
    }

    if (_birthDate == null || _birthDateController.text.isEmpty) {
      errors['birthDate'] = 'Selecciona tu fecha de nacimiento';
    }

    if (_gender == null || !_genderOptions.contains(_gender)) {
      errors['gender'] = 'Selecciona un genero';
    }

    setState(() {
      _errors = errors;
    });

    return errors.isEmpty;
  }

  String _sanitizePhone(String value) {
    return value.replaceAll(RegExp(r'\D'), '');
  }

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

    final service = ref.read(customerServiceProvider);
    final phone = _sanitizePhone(_phoneController.text);
    final payload = CustomerProfilePayload(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      phone: phone,
      birthDate: _birthDateController.text.trim(),
      gender: _gender ?? '',
    );

    try {
      if (widget.isEditing) {
        await service.updateProfile(payload);
      } else {
        await service.createProfile(payload);
      }

      if (!mounted) return;

      await ref.read(authServiceProvider).fetchMe();

      final route = await OnboardingNavigation.resolvePostAuthRoute(
        user: null,
        customerService: service,
        authService: ref.read(authServiceProvider),
        deliveryService: ref.read(deliveryServiceProvider),
        restaurantService: ref.read(restaurantServiceProvider),
      );

      if (mounted) context.go(route);
    } on CustomerProfileException catch (e) {
      if (!mounted) return;
      if (e.statusCode == 400 && e.messages.isNotEmpty) {
        _showSnack(e.messages.join('\n'));
      } else {
        _showSnack(e.message);
      }
    } catch (_) {
      if (mounted) _showSnack('Ocurrió un error, intenta nuevamente');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CompleteProfileLayout(
      onCancel: _onCancel,
      title: 'Completa tu perfil',
      subtitle: 'Necesitamos algunos datos para continuar',
      avatarPicker: ProfileAvatarPicker(
        imageUrl: null,
        onTap: () {},
      ),
      formFields: [
        CustomTextField(
          label: 'Nombre',
          controller: _firstNameController,
          errorText: _errors['firstName'],
          hintText: 'Tu nombre',
        ),
        const SizedBox(height: AppSpacing.l),
        CustomTextField(
          label: 'Apellido',
          controller: _lastNameController,
          errorText: _errors['lastName'],
          hintText: 'Tu apellido',
        ),
        const SizedBox(height: AppSpacing.l),
        CustomTextField(
          label: 'Telefono',
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(10),
          ],
          errorText: _errors['phone'],
          hintText: '3000000000',
        ),
        const SizedBox(height: AppSpacing.l),
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
        const SizedBox(height: AppSpacing.l),
        CustomDropdownField(
          label: 'Genero',
          value: _gender,
          items: _genderOptions,
          hintText: 'Selecciona una opcion',
          errorText: _errors['gender'],
          onChanged: (value) {
            setState(() {
              _gender = value;
              _errors.remove('gender');
            });
          },
        ),
      ],
      buttonLabel: widget.isEditing ? 'GUARDAR CAMBIOS' : 'GUARDAR Y CONTINUAR',
      onSubmit: _submit,
      isLoading: _isSubmitting,
    );
  }
}
