import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';
import '../components/app_logo.dart';
import '../components/futuristic_background.dart';
import '../components/primary_button.dart';

class CompleteProfileLayout extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget avatarPicker;
  final List<Widget> formFields;
  final String buttonLabel;
  final VoidCallback onSubmit;
  final bool isLoading;
  final VoidCallback? onCancel;

  const CompleteProfileLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.avatarPicker,
    required this.formFields,
    required this.buttonLabel,
    required this.onSubmit,
    required this.isLoading,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final hasAppBar = onCancel != null;
    return Scaffold(
      extendBodyBehindAppBar: hasAppBar,
      appBar: hasAppBar
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                onPressed: onCancel,
              ),
            )
          : null,
      body: FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                    SizedBox(height: hasAppBar ? 40 : 16),
                    const Center(child: AppLogo(size: 56)),
                    const SizedBox(height: 12),
                    Text(
                      title,
                      style: AppTypography.headlineMedium.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.s),
                    Text(
                      subtitle,
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.l),
                    Center(child: avatarPicker),
                    const SizedBox(height: AppSpacing.l),
                    ...formFields,
                    const SizedBox(height: AppSpacing.xl),
                    PrimaryButton(
                      label: buttonLabel,
                      onPressed: onSubmit,
                      isLoading: isLoading,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            ),
          ),
        ),
    );
  }
}

