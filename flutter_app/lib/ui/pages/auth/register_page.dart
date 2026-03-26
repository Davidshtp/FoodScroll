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
import '../../../state/auth_provider.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController(); // Added confirm
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    setState(() => _errorMessage = null);
    
    if (_passwordController.text != _confirmPasswordController.text) {
       setState(() => _errorMessage = "Las contraseñas no coinciden");
       return;
    }

    try {
      await ref.read(authControllerProvider.notifier).register(
        _emailController.text,
        _passwordController.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registro exitoso. Por favor inicia sesión.')),
        );
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
         setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authControllerProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 80), // More space for app bar
              // Logo
              const Center(child: AppLogo(size: 70)),
              const SizedBox(height: 24),
              
              Text(
                'Crear Cuenta',
                style: AppTypography.headlineMedium.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 32,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),

              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(AppSpacing.m),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.error.withOpacity(0.5)),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: AppTypography.bodyMedium.copyWith(color: AppColors.error),
                  ),
                ),

              // Inputs form
              CustomTextField(
                label: 'Correo Electrónico',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.alternate_email,
                hintText: 'usuario@foodscroll.app',
              ),
              const SizedBox(height: 24),
              CustomTextField(
                label: 'Contraseña',
                controller: _passwordController,
                obscureText: true,
                prefixIcon: Icons.lock_outline,
                hintText: '••••••••',
              ),
              const SizedBox(height: 24),
              CustomTextField(
                label: 'Confirmar Contraseña',
                controller: _confirmPasswordController,
                obscureText: true,
                prefixIcon: Icons.lock_outline,
                hintText: '••••••••',
              ),
              const SizedBox(height: 40),

              // Register Button
              PrimaryButton(
                label: 'Crear Cuenta',
                onPressed: _register,
                isLoading: state.isLoading,
              ),
              const SizedBox(height: 32),

              // Divider
              Row(
                children: [
                  const Expanded(child: Divider(color: Color(0xFF333333))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'O CONTINÚA CON',
                      style: AppTypography.labelSmall.copyWith(
                        color: const Color(0xFF666666),
                        letterSpacing: 2.0,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: Color(0xFF333333))),
                ],
              ),
              const SizedBox(height: 32),

              // Social Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _socialButton(Icons.g_mobiledata, 'GOOGLE'),
                  const SizedBox(width: 20),
                  _socialButton(Icons.facebook, 'FACEBOOK'),
                ],
              ),

              const SizedBox(height: 40),

              // Login Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   Text(
                    '¿Ya tienes cuenta? ',
                    style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Text(
                      'INICIA SESIÓN',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.primary, // Red accent
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
             
              // Footer Terms
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                child: Text(
                  'AL REGISTRARTE, CONFIRMAS QUE HAS LEÍDO Y\nACEPTAS NUESTROS TÉRMINOS DE SERVICIO Y\nPOLÍTICA DE COOKIES.',
                  textAlign: TextAlign.center,
                  style: AppTypography.labelSmall.copyWith(
                    fontSize: 9,
                    color: const Color(0xFF666666),
                    height: 1.5,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _socialButton(IconData icon, String label) {
    return Container(
      width: 140,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F0F0F),
        border: Border.all(color: const Color(0xFF333333)),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 8),
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
} // End of class
