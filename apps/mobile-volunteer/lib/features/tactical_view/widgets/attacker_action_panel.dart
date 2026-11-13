import 'package:flutter/material.dart';
import '../../../../core/theme/tactical_colors.dart';
import '../../../../core/theme/tactical_typography.dart';

/// Panel Kontrol Aksi Bawah khusus Unit ATTACKER (Tinggi 40% layar)
/// Sesuai docs/Design.md Bagian 5, 7.2 & 8:
/// - Tombol Minta Tekanan Pompa (64 dp full-width, merah pekat #EF4444)
/// - Target sentuh sarung tangan >= 64 dp
/// - Telemetri taktis berformat tabular-nums
/// - Bebas pill chips / oval badges
class AttackerActionPanel extends StatelessWidget {
  const AttackerActionPanel({
    super.key,
    required this.isPressureRequested,
    required this.onTogglePressure,
    this.unitCode = 'ATK-01',
    this.targetPressureBar = 5.0,
    this.nozzleDischargeLpm = 320,
    this.distanceToFireMeters = 35,
  });

  final bool isPressureRequested;
  final VoidCallback onTogglePressure;
  final String unitCode;
  final double targetPressureBar;
  final int nozzleDischargeLpm;
  final int distanceToFireMeters;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: TacticalColors.surface1,
      padding: const EdgeInsets.all(12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Baris 1: Tombol Kritis Minta Tekanan Pompa (Tinggi 64 dp full-width)
          SizedBox(
            height: 64.0,
            child: Material(
              color: isPressureRequested
                  ? TacticalColors.attacker
                  : const Color(0x33EF4444), // Translucent red when standby
              shape: RoundedRectangleBorder(
                side: const BorderSide(color: TacticalColors.attacker, width: 2.0),
                borderRadius: BorderRadius.circular(2.0), // Flat tactical edges
              ),
              child: InkWell(
                onTap: onTogglePressure,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.speed,
                        size: 28,
                        color: isPressureRequested
                            ? TacticalColors.surface0
                            : TacticalColors.attacker,
                      ),
                      const SizedBox(width: 12.0),
                      Flexible(
                        child: Text(
                          isPressureRequested
                              ? 'TEKANAN DIMINTA: ${targetPressureBar.toStringAsFixed(1)} BAR'
                              : 'MINTA TEKANAN POMPA (${targetPressureBar.toStringAsFixed(1)} BAR)',
                          style: TacticalTypography.sectionTitleH2.copyWith(
                            color: isPressureRequested
                                ? TacticalColors.surface0
                                : TacticalColors.attacker,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12.0),
          // Baris 2: Matriks Telemetri Serbu Unit (Tabular figures)
          Expanded(
            child: Row(
              children: [
                // Kartu Jarak ke Titik Api
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10.0),
                    decoration: BoxDecoration(
                      color: TacticalColors.surface0,
                      border: Border.all(color: TacticalColors.borderSubtle, width: 1.0),
                      borderRadius: BorderRadius.circular(2.0),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'JARAK KE API',
                          style: TacticalTypography.labelEyebrow,
                        ),
                        const SizedBox(height: 4.0),
                        Text(
                          '${distanceToFireMeters} M',
                          style: TacticalTypography.tabularNumeric(
                            fontSize: 20,
                            color: TacticalColors.attacker,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8.0),
                // Kartu Debit Pancaran Nozel
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10.0),
                    decoration: BoxDecoration(
                      color: TacticalColors.surface0,
                      border: Border.all(color: TacticalColors.borderSubtle, width: 1.0),
                      borderRadius: BorderRadius.circular(2.0),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'DEBIT NOZEL',
                          style: TacticalTypography.labelEyebrow,
                        ),
                        const SizedBox(height: 4.0),
                        Text(
                          '$nozzleDischargeLpm LPM',
                          style: TacticalTypography.tabularNumeric(
                            fontSize: 20,
                            color: TacticalColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
