import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/onboarding_navigation.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../services/restaurant_service.dart';
import '../../../services/customer_service.dart';
import '../../../services/delivery_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_text_field.dart';
import '../../components/primary_button.dart';
import '../../components/profile_avatar_picker.dart';
import '../../components/futuristic_background.dart';
import '../../components/app_logo.dart';

class RestaurantProfilePage extends ConsumerStatefulWidget {
  const RestaurantProfilePage({super.key});

  @override
  ConsumerState<RestaurantProfilePage> createState() => _RestaurantProfilePageState();
}

class _RestaurantProfilePageState extends ConsumerState<RestaurantProfilePage> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();

  bool _isSubmitting = false;
  Map<String, String> _errors = {};
  Uint8List? _selectedImageBytes;
  String? _selectedImageName;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  bool _validateForm() {
    final errors = <String, String>{};

    if (_nameController.text.trim().isEmpty) {
      errors['name'] = 'Ingresa el nombre del restaurante';
    }
    if (_descriptionController.text.trim().isEmpty) {
      errors['description'] = 'Ingresa una descripción';
    }

    final phoneDigits = _sanitizePhone(_phoneController.text);
    if (!RegExp(r'^3\d{9}$').hasMatch(phoneDigits)) {
      errors['phone'] = 'Debe tener 10 dígitos y comenzar con 3';
    }

    if (_emailController.text.trim().isEmpty ||
        !_emailController.text.trim().contains('@')) {
      errors['email'] = 'Ingresa un email válido';
    }

    setState(() => _errors = errors);
    return errors.isEmpty;
  }

  String _sanitizePhone(String value) => value.replaceAll(RegExp(r'\D'), '');

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: const Color(0xFF1E1E2E),
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
                color: Colors.grey.withValues(alpha: 0.3),
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
          ],
        ),
      ),
    );

    if (source == null) return;

    final picked = await picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (picked != null && mounted) {
      final bytes = await picked.readAsBytes();
      final name = picked.name;
      setState(() {
        _selectedImageBytes = bytes;
        _selectedImageName = name;
      });
    }
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

    final payload = RestaurantProfilePayload(
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      phone: _sanitizePhone(_phoneController.text),
      email: _emailController.text.trim(),
    );

    try {
      final restaurantService = ref.read(restaurantServiceProvider);
      await restaurantService.createProfile(payload);
      if (!mounted) return;

      if (_selectedImageBytes != null && _selectedImageName != null) {
        try {
          await restaurantService.updateLogo(_selectedImageBytes!, _selectedImageName!);
        } catch (_) {}
      }

      try {
        await ref.read(authServiceProvider).fetchMe();
      } catch (_) {}

      final route = await OnboardingNavigation.resolvePostAuthRoute(
        user: null,
        customerService: ref.read(customerServiceProvider),
        authService: ref.read(authServiceProvider),
        deliveryService: ref.read(deliveryServiceProvider),
        restaurantService: ref.read(restaurantServiceProvider),
      );

      if (mounted) context.go(route);
    } on RestaurantProfileException catch (e) {
      if (mounted) {
        _showSnack(e.messages.isNotEmpty ? e.messages.join('\n') : e.message);
      }
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
                  'Tu Restaurante',
                  style: AppTypography.headlineMedium.copyWith(
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Cuéntanos sobre tu negocio',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                Center(
                  child: ProfileAvatarPicker(
                    imageUrl: null,
                    localImageBytes: _selectedImageBytes,
                    onTap: _pickImage,
                    size: 120,
                  ),
                ),
                const SizedBox(height: AppSpacing.l),
                CustomTextField(
                  label: 'Nombre del restaurante',
                  controller: _nameController,
                  errorText: _errors['name'],
                  hintText: 'Mi Restaurante',
                  prefixIcon: Icons.store,
                ),
                const SizedBox(height: AppSpacing.m),
                CustomTextField(
                  label: 'Descripción',
                  controller: _descriptionController,
                  errorText: _errors['description'],
                  hintText: 'Comida colombiana tradicional',
                  prefixIcon: Icons.description,
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
                  hintText: '3001234567',
                  prefixIcon: Icons.phone,
                ),
                const SizedBox(height: AppSpacing.m),
                CustomTextField(
                  label: 'Email de contacto',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  errorText: _errors['email'],
                  hintText: 'contacto@mirestaurante.com',
                  prefixIcon: Icons.email_outlined,
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
}

