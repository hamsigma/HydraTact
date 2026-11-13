import 'package:flutter/material.dart';
import '../../../core/database/schemas/cached_water_source.dart';
import '../../../core/theme/tactical_colors.dart';

/// Komponen Aksi Pembaruan Status Air 1-Tap (Glove-Friendly Touch Target >= 48 dp)
/// Sesuai docs/Design.md Bagian 5.4 & TASK-405:
/// - Tiga tombol berdampingan dengan tinggi masing-masing 52 dp:
///   1. [ READY ] (Border #10B981, teks hijau)
///   2. [ DEBIT RENDAH ] (Border #F59E0B, teks kuning)
///   3. [ KERING ] (Border #64748B, teks abu-abu)
/// - Mengetuk salah satu tombol langsung memperbarui status seketika (Optimistic UI)
/// - Strictly NO pill chips / oval badges (sudut datar radius <= 2 px, border 1.5 px)
class WaterStatus1TapBar extends StatelessWidget {
  const WaterStatus1TapBar({
    super.key,
    required this.source,
    required this.onSelectStatus,
    this.currentStatus,
  });

  final CachedWaterSource source;
  final ValueChanged<String> onSelectStatus;
  final String? currentStatus;

  @override
  Widget build(BuildContext context) {
    final activeStatus = (currentStatus ?? source.operationalStatus).toUpperCase();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Header nama titik air
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'UPDATE STATUS: ${source.name.toUpperCase()}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: TacticalColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              '1-TAP SARUNG TANGAN (52 DP)',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: TacticalColors.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // 3 Tombol Berdampingan Tinggi 52 dp (Ramah Sarung Tangan)
        Row(
          children: [
            Expanded(
              child: _StatusActionButton(
                label: 'READY',
                statusKey: 'READY',
                borderColor: TacticalColors.waterReady,
                textColor: TacticalColors.waterReady,
                isSelected: activeStatus == 'READY',
                onTap: () => onSelectStatus('READY'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatusActionButton(
                label: 'DEBIT RENDAH',
                statusKey: 'LOW_DISCHARGE',
                borderColor: TacticalColors.waterLowDischarge,
                textColor: TacticalColors.waterLowDischarge,
                isSelected: activeStatus == 'LOW_DISCHARGE',
                onTap: () => onSelectStatus('LOW_DISCHARGE'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatusActionButton(
                label: 'KERING',
                statusKey: 'EMPTY',
                borderColor: TacticalColors.waterEmpty,
                textColor: TacticalColors.waterEmpty,
                isSelected: activeStatus == 'EMPTY',
                onTap: () => onSelectStatus('EMPTY'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatusActionButton extends StatelessWidget {
  const _StatusActionButton({
    required this.label,
    required this.statusKey,
    required this.borderColor,
    required this.textColor,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final String statusKey;
  final Color borderColor;
  final Color textColor;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52.0, // Tepat 52 dp sesuai Design.md §5.4 (>= 48 dp)
      child: Material(
        color: isSelected ? borderColor.withValues(alpha: 0.18) : TacticalColors.surface1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(2), // Flat angular, NO pill chip
          side: BorderSide(
            color: isSelected ? borderColor : borderColor.withValues(alpha: 0.5),
            width: isSelected ? 2.0 : 1.0,
          ),
        ),
        child: InkWell(
          onTap: onTap,
          splashColor: borderColor.withValues(alpha: 0.25),
          highlightColor: borderColor.withValues(alpha: 0.15),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                    color: isSelected ? textColor : textColor.withValues(alpha: 0.8),
                  ),
                ),
                if (isSelected) ...[
                  const SizedBox(height: 2),
                  Container(
                    width: 12,
                    height: 2,
                    color: borderColor,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
