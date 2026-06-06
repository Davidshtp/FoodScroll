import 'package:flutter/material.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/primary_button.dart';

class EditProfileSheet extends StatelessWidget {
  final String title;
  final List<Widget> fields;
  final bool isLoading;
  final VoidCallback onSave;

  const EditProfileSheet({
    super.key,
    required this.title,
    required this.fields,
    this.isLoading = false,
    required this.onSave,
  });

  static Future<void> show(
    BuildContext context, {
    required String title,
    required List<Widget> fields,
    required VoidCallback onSave,
    bool isLoading = false,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EditProfileSheet(
        title: title,
        fields: fields,
        onSave: onSave,
        isLoading: isLoading,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.l,
          right: AppSpacing.l,
          top: AppSpacing.l,
          bottom: bottomInset + AppSpacing.l,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textTertiary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.m),
            Text(
              title,
              style: AppTypography.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.l),
            ...fields,
            const SizedBox(height: AppSpacing.l),
            PrimaryButton(
              label: 'Guardar',
              onPressed: onSave,
              isLoading: isLoading,
            ),
          ],
        ),
      ),
    );
  }
}
