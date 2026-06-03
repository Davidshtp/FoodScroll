import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/onboarding_navigation.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../services/restaurant_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../../theme/app_shadows.dart';
import '../../components/primary_button.dart';
import '../../components/futuristic_background.dart';
import '../../components/app_logo.dart';

class OpeningHoursPage extends ConsumerStatefulWidget {
  const OpeningHoursPage({super.key});

  @override
  ConsumerState<OpeningHoursPage> createState() => _OpeningHoursPageState();
}

class _OpeningHoursPageState extends ConsumerState<OpeningHoursPage> {
  late List<_DaySchedule> _schedules;
  bool _isSubmitting = false;

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

  static const _dayNames = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado',
  ];

  static const _dayAbbr = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  @override
  void initState() {
    super.initState();
    _schedules = List.generate(7, (i) {
      return _DaySchedule(
        dayOfWeek: i,
        isClosed: i == 6,
        openTime: const TimeOfDay(hour: 8, minute: 0),
        closeTime: const TimeOfDay(hour: 18, minute: 0),
      );
    });
  }

  Future<void> _pickTime({required int dayIndex, required bool isOpen}) async {
    final schedule = _schedules[dayIndex];
    final initial = isOpen ? schedule.openTime : schedule.closeTime;

    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: AppColors.primary,
                  onPrimary: Colors.white,
                  surface: AppColors.surface,
                  onSurface: Colors.white,
                ),
            dialogTheme: Theme.of(context).dialogTheme.copyWith(
                  backgroundColor: AppColors.surface,
                ),
          ),
          child: MediaQuery(
            data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
            child: child ?? const SizedBox.shrink(),
          ),
        );
      },
    );

    if (picked == null) return;

    setState(() {
      if (isOpen) {
        _schedules[dayIndex] = schedule.copyWith(openTime: picked);
      } else {
        _schedules[dayIndex] = schedule.copyWith(closeTime: picked);
      }
    });
  }

  void _toggleClosed(int index) {
    setState(() {
      _schedules[index] = _schedules[index].copyWith(
        isClosed: !_schedules[index].isClosed,
      );
    });
  }

  String _formatTime(TimeOfDay time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Future<void> _submit() async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    final hours = _schedules.map((s) {
      return OpeningHour(
        dayOfWeek: s.dayOfWeek,
        openTime: s.isClosed ? null : _formatTime(s.openTime),
        closeTime: s.isClosed ? null : _formatTime(s.closeTime),
        isClosed: s.isClosed,
      );
    }).toList();

    try {
      await ref.read(restaurantServiceProvider).updateOpeningHours(
            OpeningHoursPayload(hours: hours),
          );
      if (!mounted) return;
      await ref.read(authServiceProvider).fetchMe();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Horario guardado correctamente')),
        );
        context.go('/home');
      }
    } on RestaurantProfileException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ocurrió un error, intenta nuevamente')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
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
              const Center(child: AppLogo(size: 50)),
                const SizedBox(height: 12),
                Text(
                  'Horario de Atención',
                  style: AppTypography.headlineMedium.copyWith(
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Configura los días y horas de tu restaurante',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ...List.generate(7, (i) => _buildDayCard(i)),
                const SizedBox(height: AppSpacing.l),
                PrimaryButton(
                  label: 'Guardar horario',
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

  Widget _buildDayCard(int index) {
    final schedule = _schedules[index];
    final isToday = index == DateTime.now().weekday % 7;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isToday ? AppColors.primary.withValues(alpha: 0.5) : AppColors.border.withValues(alpha: 0.3),
          width: isToday ? 1.5 : 1,
        ),
        boxShadow: isToday ? AppShadows.glow : null,
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: schedule.isClosed
                        ? AppColors.error.withValues(alpha: 0.15)
                        : AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      _dayAbbr[index],
                      style: AppTypography.labelLarge.copyWith(
                        color: schedule.isClosed ? AppColors.error : AppColors.primary,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _dayNames[index],
                        style: AppTypography.titleMedium.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      if (isToday)
                        Text(
                          'HOY',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.accent,
                            fontWeight: FontWeight.w800,
                            fontSize: 8,
                            letterSpacing: 2,
                          ),
                        ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => _toggleClosed(index),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: schedule.isClosed
                          ? AppColors.error.withValues(alpha: 0.2)
                          : AppColors.success.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      schedule.isClosed ? 'CERRADO' : 'ABIERTO',
                      style: AppTypography.labelSmall.copyWith(
                        color: schedule.isClosed ? AppColors.error : AppColors.success,
                        fontWeight: FontWeight.w800,
                        fontSize: 9,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            if (!schedule.isClosed) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _buildTimeChip(
                      label: 'APERTURA',
                      time: _formatTime(schedule.openTime),
                      icon: Icons.wb_sunny_outlined,
                      onTap: () => _pickTime(dayIndex: index, isOpen: true),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Icon(Icons.arrow_forward, color: AppColors.textTertiary, size: 18),
                  ),
                  Expanded(
                    child: _buildTimeChip(
                      label: 'CIERRE',
                      time: _formatTime(schedule.closeTime),
                      icon: Icons.nightlight_outlined,
                      onTap: () => _pickTime(dayIndex: index, isOpen: false),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTimeChip({
    required String label,
    required String time,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.inputBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.accent, size: 14),
            const SizedBox(width: 6),
            Column(
              children: [
                Text(
                  label,
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.textTertiary,
                    fontSize: 7,
                    letterSpacing: 1,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  time,
                  style: AppTypography.titleLarge.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DaySchedule {
  final int dayOfWeek;
  final bool isClosed;
  final TimeOfDay openTime;
  final TimeOfDay closeTime;

  const _DaySchedule({
    required this.dayOfWeek,
    this.isClosed = false,
    required this.openTime,
    required this.closeTime,
  });

  _DaySchedule copyWith({
    int? dayOfWeek,
    bool? isClosed,
    TimeOfDay? openTime,
    TimeOfDay? closeTime,
  }) {
    return _DaySchedule(
      dayOfWeek: dayOfWeek ?? this.dayOfWeek,
      isClosed: isClosed ?? this.isClosed,
      openTime: openTime ?? this.openTime,
      closeTime: closeTime ?? this.closeTime,
    );
  }
}
