import 'package:flutter/material.dart';
import '../../../../core/theme/tactical_colors.dart';
import '../../../../core/theme/tactical_typography.dart';

/// Panel Kontrol Aksi Bawah khusus Unit FEEDER (Tinggi 40% layar)
/// Sesuai docs/Design.md Bagian 5.3, 7.2 & 8:
/// - Sakelar Barikade Selang Jalan (64 dp full-width, border #D946EF)
/// - Penunjuk Lokasi Parkir Terkunci di Arteri Utama (>= 6 m)
/// - Telemetri Volume Tangki Air (Liter)
/// - Bebas pill chips / oval badges
class FeederActionPanel extends StatelessWidget {
  const FeederActionPanel({
    super.key,
    required this.isBarricadeActive,
    required this.onToggleBarricade,
    this.unitCode = 'FDR-01',
    this.arteryRoadName = 'JL. PELITA UTAMA',
    this.remainingWaterLiters = 4200,
    this.maxCapacityLiters = 5000,
  });

  final bool isBarricadeActive;
  final VoidCallback onToggleBarricade;
  final String unitCode;
  final String arteryRoadName;
  final int remainingWaterLiters;
  final int maxCapacityLiters;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: TacticalColors.surface1,
      padding: const EdgeInsets.all(12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Baris 1: Sakelar Barikade Selang Jalan (Tinggi 64 dp full-width)
          SizedBox(
            height: 64.0,
            child: Material(
              color: isBarricadeActive
                  ? TacticalColors.barricadeActiveBg
                  : TacticalColors.surface0,
              shape: RoundedRectangleBorder(
                side: BorderSide(
                  color: TacticalColors.barricade,
                  width: isBarricadeActive ? 2.0 : 1.5,
                ),
                borderRadius: BorderRadius.circular(2.0), // Flat edges
              ),
              child: InkWell(
                onTap: onToggleBarricade,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.warning_amber_rounded,
                        size: 26,
                        color: TacticalColors.barricade,
                      ),
                      const SizedBox(width: 12.0),
                      Flexible(
                        child: Text(
                          isBarricadeActive
                              ? 'BARIKADE AKTIF: SELANG TERBENTANG'
                              : 'AKTIFKAN BARIKADE SELANG',
                          style: TacticalTypography.sectionTitleH2.copyWith(
                            color: TacticalColors.barricade,
                            fontSize: 13,
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
          // Baris 2: Alokasi Parkir Arteri & Sisa Air Tangki
          Expanded(
            child: Row(
              children: [
                // Kartu Alokasi Parkir Arteri
                Expanded(
                  flex: 5,
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
                          'PARKIR ARTERI (>= 6M)',
                          style: TacticalTypography.labelEyebrow,
                        ),
                        const SizedBox(height: 4.0),
                        Text(
                          arteryRoadName,
                          style: TacticalTypography.sectionTitleH2.copyWith(
                            color: TacticalColors.feeder,
                            fontSize: 13,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8.0),
                // Kartu Sisa Air Tangki
                Expanded(
                  flex: 4,
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
                          'SISA AIR TANGKI',
                          style: TacticalTypography.labelEyebrow,
                        ),
                        const SizedBox(height: 4.0),
                        Text(
                          '$remainingWaterLiters L',
                          style: TacticalTypography.tabularNumeric(
                            fontSize: 18,
                            color: TacticalColors.waterReady,
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
