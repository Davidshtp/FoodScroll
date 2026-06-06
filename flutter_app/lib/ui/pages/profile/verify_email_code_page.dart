import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../services/code_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_text_field.dart';
import '../../components/primary_button.dart';

class VerifyEmailCodePage extends ConsumerStatefulWidget {
  final String email;

  const VerifyEmailCodePage({super.key, required this.email});

  @override
  ConsumerState<VerifyEmailCodePage> createState() => _VerifyEmailCodePageState();
}

class _VerifyEmailCodePageState extends ConsumerState<VerifyEmailCodePage> {
  final _codeController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final code = _codeController.text.trim();
    if (code.isEmpty) {
      setState(() => _error = 'Ingresa el código de verificación');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(codeServiceProvider).verifyConfirmEmail(widget.email, code);
      await ref.read(authServiceProvider).fetchMe();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Correo verificado exitosamente')),
      );
      context.pop();
      context.pop();
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
        title: const Text('Verificar código'),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Ingresa el código de verificación',
              style: AppTypography.titleLarge,
            ),
            const SizedBox(height: AppSpacing.s),
            Text(
              'Enviamos un código a ${widget.email}',
              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.xl),
            CustomTextField(
              label: 'Código',
              controller: _codeController,
              keyboardType: TextInputType.number,
              hintText: '000000',
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
              label: 'Verificar',
              onPressed: _submit,
              isLoading: _isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
