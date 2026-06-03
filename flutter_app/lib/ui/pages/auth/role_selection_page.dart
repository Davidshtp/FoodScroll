import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/app_typography.dart';
import '../../components/role_card.dart';
import '../../components/app_logo.dart';
import '../../components/futuristic_background.dart';
import '../../../state/auth_provider.dart';

class RoleSelectionPage extends ConsumerWidget {
  const RoleSelectionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: FuturisticBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
              // Logo
              const SizedBox(height: 20),
              const Align(
                alignment: Alignment.topCenter,
                child: AppLogo(size: 80),
              ),
              const SizedBox(height: 32),

              // Title
              Text(
                '¿Cómo vas a usar\nFoodScroll?',
                style: AppTypography.headlineMedium.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 26,
                  height: 1.2,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),

              // Cards
              _buildRoleOption(
                context: context,
                ref: ref,
                title: 'Quiero pedir\ncomida',
                icon: Icons.restaurant,
                role: 'customer',
                isHighlighted: true, // Only this one is filled/highlighted
              ),
              const SizedBox(height: 24),
              _buildRoleOption(
                context: context,
                ref: ref,
                title: 'Quiero ser\nrepartidor',
                icon: Icons.delivery_dining, // Moto icon ideally
                role: 'delivery',
                isHighlighted: false,
              ),
              const SizedBox(height: 24),
              _buildRoleOption(
                context: context,
                ref: ref,
                title: 'Quiero registrar\nmi restaurante',
                icon: Icons.store,
                role: 'restaurant',
                isHighlighted: false,
              ),

              const SizedBox(height: 32),
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Text(
                    'FOODSCROLL LOGÍSTICA DE USUARIOS © 2026',
                    style: AppTypography.labelSmall.copyWith(
                      color: const Color(0xFF444444),
                      letterSpacing: 3.0,
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                  ),
                ),
              ),
            ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleOption({
    required BuildContext context,
    required WidgetRef ref,
    required String title,
    required IconData icon,
    required String role,
    required bool isHighlighted,
  }) {
    return RoleCard(
      title: title,
      icon: icon,
      isSelected: isHighlighted,
      onTap: () async {
        final auth = ref.read(authServiceProvider);
        if (await auth.isLoggedIn()) {
          await auth.logout();
        }
        await auth.saveClientType(role);
        if (context.mounted) {
          context.go('/login');
        }
      },
    );
  }
}
