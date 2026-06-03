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
import '../../../core/onboarding_navigation.dart';
import '../../../models/user_model.dart';
import '../../../state/auth_provider.dart';
import '../../../services/customer_service.dart';
import '../../../services/delivery_service.dart';
import '../../../services/restaurant_service.dart';
import '../../../services/storage_service.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() => _errorMessage = null);
    try {
      await ref.read(authControllerProvider.notifier).login(
        _emailController.text,
        _passwordController.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Login exitoso')),
        );
      }
      await _handlePostLogin();
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.displayMessage);
    } catch (e) {
      setState(() => _errorMessage = e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> _handlePostLogin() async {
    final storage = StorageService();
    final userData = await storage.getUser();
    final user = userData != null ? AuthUser.fromJson(userData) : null;

    if (!mounted) {
      return;
    }

    try {
      final route = await OnboardingNavigation.resolvePostAuthRoute(
        user: user,
        customerService: ref.read(customerServiceProvider),
        authService: ref.read(authServiceProvider),
        deliveryService: ref.read(deliveryServiceProvider),
        restaurantService: ref.read(restaurantServiceProvider),
      );
      if (mounted) {
        context.go(route);
      }
    } on CustomerProfileException catch (e) {
      if (!mounted) {
        return;
      }
      if (e.statusCode == 401) {
        context.go('/login');
        return;
      }
      setState(() => _errorMessage = e.message);
    } on DeliveryProfileException catch (e) {
      if (!mounted) {
        return;
      }
      setState(() => _errorMessage = e.message);
    } catch (_) {
      if (mounted) {
        setState(
          () => _errorMessage = 'Ocurrió un error, intenta nuevamente',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authControllerProvider);

    return Scaffold(
      body: FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 36),
              // Logo
              const Center(child: AppLogo(size: 62)),
              const SizedBox(height: 20),
              
              Text(
                'Bienvenido',
                style: AppTypography.headlineLarge.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 34,
                  color: Colors.white,
                  letterSpacing: -1.0,
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
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.5)),
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
              const SizedBox(height: 16),
              CustomTextField(
                label: 'Contraseña',
                controller: _passwordController,
                obscureText: true,
                prefixIcon: Icons.lock_outline,
                hintText: '••••••••',
              ),
              
              // Forgot Password Link
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push('/forgot-password'),
                  child: Text(
                    '¿OLVIDASTE TU CONTRASEÑA?',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.accent,
                      letterSpacing: 0.5,
                      fontSize: 10,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Login Button
              PrimaryButton(
                label: 'Iniciar Sesión',
                onPressed: _login,
                isLoading: state.isLoading,
              ),
              const SizedBox(height: 24),

              // Divider "O CONTINÚA CON" (Thinner, more subtle)
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
              const SizedBox(height: 20),

              // Social Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _socialButton(Icons.g_mobiledata, 'GOOGLE'), // Ideally use SVG
                  const SizedBox(width: 20),
                  _socialButton(Icons.facebook, 'FACEBOOK'),
                ],
              ),

              const SizedBox(height: 32),

              // Register Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '¿No tienes una cuenta? ',
                    style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                  ),
                  GestureDetector(
                    onTap: () => context.push('/register'),
                    child: Text(
                      'REGÍSTRATE',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.accent,
                        decoration: TextDecoration.none, // Often better without underline in modern apps, but design might show it. Keeping clean.
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // Footer Terms
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Text(
                  'AL INICIAR SESIÓN, CONFIRMAS QUE HAS LEÍDO Y\nACEPTAS NUESTROS TÉRMINOS DE SERVICIO Y\nPOLÍTICA DE COOKIES.',
                  textAlign: TextAlign.center,
                  style: AppTypography.labelSmall.copyWith(
                    fontSize: 9,
                    color: AppColors.textTertiary.withValues(alpha: 0.4),
                    height: 1.5,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
               // Change Role (Hidden or small at bottom, not in design explicitly but needed for flow)
               Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: OutlinedButton(
                  onPressed: () async {
                    await ref.read(authServiceProvider).clearClientType();
                    if (context.mounted) {
                      context.go('/');
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppColors.accent.withValues(alpha: 0)),
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                  child: Text(
                    'Cambiar tipo de cuenta',
                    style: AppTypography.labelLarge.copyWith(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
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
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F0F0F), // Dark background
        border: Border.all(color: const Color(0xFF333333)), // Standard border
        borderRadius: BorderRadius.circular(30), // Pill shape
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
}
