import 'dart:math';
import 'dart:typed_data';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class ProfileAvatarPicker extends StatelessWidget {
  final String? imageUrl;
  final Uint8List? localImageBytes;
  final VoidCallback onTap;
  final double size;
  final bool showLabel;

  const ProfileAvatarPicker({
    super.key,
    required this.imageUrl,
    required this.onTap,
    this.localImageBytes,
    this.size = 120,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    final hasNetworkImage = imageUrl != null && imageUrl!.isNotEmpty;
    final hasLocalImage = localImageBytes != null;
    final hasImage = hasNetworkImage || hasLocalImage;
    final innerSize = size - 20;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          SizedBox(
            width: size,
            height: size,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CustomPaint(
                  size: Size(size, size),
                  painter: DashedCirclePainter(
                    color: AppColors.cardOutline.withValues(alpha: 0.6),
                    strokeWidth: 1.5,
                  ),
                ),
                ClipOval(
                  child: Container(
                    width: innerSize,
                    height: innerSize,
                    decoration: const BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                    ),
                    child: hasImage
                        ? (hasLocalImage
                            ? Image.memory(
                                localImageBytes!,
                                fit: BoxFit.cover,
                                width: innerSize,
                                height: innerSize,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(
                                  Icons.camera_alt,
                                  color: AppColors.textSecondary,
                                  size: 28,
                                ),
                              )
                            : CachedNetworkImage(
                                imageUrl: imageUrl!,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => const Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.primary,
                                  ),
                                ),
                                errorWidget: (context, url, error) =>
                                    const Icon(
                                  Icons.camera_alt,
                                  color: AppColors.textSecondary,
                                  size: 28,
                                ),
                              ))
                        : const Icon(
                            Icons.camera_alt,
                            color: AppColors.textSecondary,
                            size: 28,
                          ),
                  ),
                ),
              ],
            ),
          ),
          if (showLabel) ...[
            const SizedBox(height: 8),
            Text(
              'SUBIR IMAGEN',
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.accent,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class DashedCirclePainter extends CustomPainter {
  final Color color;
  final double strokeWidth;

  const DashedCirclePainter({
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;
    const dashAngle = 10 * pi / 180;
    const gapAngle = 6 * pi / 180;

    double startAngle = 0;
    while (startAngle < 2 * pi) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        dashAngle,
        false,
        paint,
      );
      startAngle += dashAngle + gapAngle;
    }
  }

  @override
  bool shouldRepaint(covariant DashedCirclePainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
  }
}
