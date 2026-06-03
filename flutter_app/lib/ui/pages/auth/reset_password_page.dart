import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../../theme/app_colors.dart';
import '../../components/custom_text_field.dart';
import '../../components/primary_button.dart';
import '../../components/app_logo.dart';
import '../../components/futuristic_background.dart';
import '../../../core/api_exception.dart';
import '../../../state/providers.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  final String email;

  const ResetPasswordPage({super.key, required this.email});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  String? _errorMessage;
  bool _isLoading = false;

  @override
  void dispose() {
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  bool _validateForm() {
    final code = _codeController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (code.isEmpty) {
      setState(() => _errorMessage = 'Ingresa el código de verificación');
      return false;
    }
    if (password.isEmpty) {
      setState(() => _errorMessage = 'Ingresa una nueva contraseña');
      return false;
    }
    if (password.length < 6) {
      setState(
        () => _errorMessage = 'La contraseña debe tener al menos 6 caracteres',
      );
      return false;
    }
    if (password != confirmPassword) {
      setState(() => _errorMessage = 'Las contraseñas no coinciden');
      return false;
    }
    return true;
  }

  Future<void> _confirmReset() async {
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    if (!_validateForm()) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final api = ref.read(apiServiceProvider);
      await api.post(
        '/code/verify-reset-code',
        data: {
          'email': widget.email,
          'code': _codeController.text.trim(),
          'newPassword': _passwordController.text,
        },
        sendAuth: false,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contraseña cambiada con éxito')),
        );
        context.go('/login');
      }
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.displayMessage);
    } catch (e) {
      setState(
        () => _errorMessage = e.toString().replaceAll('Exception: ', ''),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 36),
              const Center(child: AppLogo(size: 62)),
              const SizedBox(height: 20),

              Text(
                'Restablecer Contraseña',
                style: AppTypography.headlineLarge.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 28,
                  color: Colors.white,
                  letterSpacing: -1.0,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Ingresa el código y tu nueva contraseña',
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),

              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                ),

              CustomTextField(
                label: 'Correo Electrónico',
                controller: TextEditingController(text: widget.email),
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.alternate_email,
                readOnly: true,
              ),
              const SizedBox(height: 16),

              CustomTextField(
                label: 'Código de Verificación',
                controller: _codeController,
                keyboardType: TextInputType.number,
                prefixIcon: Icons.pin,
                hintText: '000000',
              ),
              const SizedBox(height: 16),

              CustomTextField(
                label: 'Nueva Contraseña',
                controller: _passwordController,
                obscureText: true,
                prefixIcon: Icons.lock_outline,
                hintText: '••••••••',
              ),
              const SizedBox(height: 16),

              CustomTextField(
                label: 'Confirmar Contraseña',
                controller: _confirmPasswordController,
                obscureText: true,
                prefixIcon: Icons.lock_outline,
                hintText: '••••••••',
              ),
              const SizedBox(height: 24),

              PrimaryButton(
                label: 'Confirmar',
                onPressed: _confirmReset,
                isLoading: _isLoading,
              ),
              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '¿Ya tienes una cuenta? ',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Text(
                      'INICIAR SESIÓN',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.accent,
                        decoration: TextDecoration.none,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
