import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../services/code_service.dart';
import '../../../services/storage_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_text_field.dart';
import '../../components/primary_button.dart';

class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({super.key});

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  final _emailController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadEmail();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadEmail() async {
    final storage = StorageService();
    final user = await storage.getUser();
    if (user != null && mounted) {
      _emailController.text = user['email']?.toString() ?? '';
    }
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Ingresa tu correo electrónico');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(codeServiceProvider).requestConfirmEmail(email);
      if (!mounted) return;
      context.push('/verify-email-code', extra: email);
    } on CodeServiceException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Ocurrió un error, intenta nuevamente');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Verificar correo'),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Ingresa tu correo electrónico',
              style: AppTypography.titleLarge,
            ),
            const SizedBox(height: AppSpacing.s),
            Text(
              'Te enviaremos un código de verificación',
              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.xl),
            CustomTextField(
              label: 'Correo electrónico',
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              hintText: 'correo@ejemplo.com',
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.s),
              Text(
                _error!,
                style: AppTypography.bodyMedium.copyWith(color: AppColors.error),
              ),
            ],
            const SizedBox(height: AppSpacing.xl),
            PrimaryButton(
              label: 'Enviar código',
              onPressed: _submit,
              isLoading: _isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
