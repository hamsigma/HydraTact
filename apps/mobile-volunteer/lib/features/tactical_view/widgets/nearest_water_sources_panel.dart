import 'package:flutter/material.dart';
import '../../../core/database/schemas/cached_water_source.dart';
import '../../../core/theme/tactical_colors.dart';
import '../../../core/utils/geo_utils.dart';

/// Panel 3 Titik Sumber Air Terdekat untuk Tampilan Taktis Relawan
/// Sesuai docs/Design.md Bagian 5 & TASK-404:
/// - Menggunakan formula Haversine lokal untuk mengurutkan jarak
/// - Filter status: READY dan LOW_DISCHARGE
/// - Strictly NO pill chips / oval badges (hanya border flat 1px, typography monospaced)
/// - Target sentuhan per baris >= 48 dp (glove-friendly)
class NearestWaterSourcesPanel extends StatelessWidget {
  const NearestWaterSourcesPanel({
    super.key,
    required this.items,
    this.onSelectSource,
    this.title = 'SUMBER AIR TERDEKAT',
  });

  final List<WaterSourceWithDistance> items;
  final ValueChanged<CachedWaterSource>? onSelectSource;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: TacticalColors.surface1,
        border: Border.all(color: TacticalColors.borderSubtle, width: 1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Section Eyebrow (Plain typography, NO capsule, NO pulse dot)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                    color: TacticalColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${items.length} TITIK SIAP',
                style: const TextStyle(
                  fontSize: 10,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: TacticalColors.feeder,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (items.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              alignment: Alignment.center,
              child: const Text(
                'TIDAK ADA SUMBER AIR AKTIF DALAM JANGKAUAN',
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: TacticalColors.textMuted,
                ),
              ),
            )
          else
            Column(
              children: [
                for (int i = 0; i < items.length; i++) ...[
                  _WaterSourceRow(
                    index: i + 1,
                    item: items[i],
                    onTap: () => onSelectSource?.call(items[i].source),
                  ),
                  if (i < items.length - 1)
                    const Divider(
                      height: 8,
                      thickness: 1,
                      color: TacticalColors.borderSubtle,
                    ),
                ],
              ],
            ),
        ],
      ),
    );
  }
}

class _WaterSourceRow extends StatelessWidget {
  const _WaterSourceRow({
    required this.index,
    required this.item,
    required this.onTap,
  });

  final int index;
  final WaterSourceWithDistance item;
  final VoidCallback onTap;

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'READY':
        return TacticalColors.waterReady;
      case 'LOW_DISCHARGE':
        return TacticalColors.waterLowDischarge;
      case 'EMPTY':
        return TacticalColors.waterEmpty;
      case 'DAMAGED':
      default:
        return TacticalColors.waterDamaged;
    }
  }

  String _formatStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'READY':
        return 'READY';
      case 'LOW_DISCHARGE':
        return 'DEBIT RENDAH';
      case 'EMPTY':
        return 'KERING';
      case 'DAMAGED':
        return 'RUSAK';
      default:
        return status;
    }
  }

  String _formatSourceType(String type) {
    switch (type.toUpperCase()) {
      case 'PDAM_HYDRANT':
        return 'HIDRAN PDAM';
      case 'COMMUNITY_TOWER':
        return 'TANDON WARGA';
      case 'RIVER_TIDAL_DOCK':
        return 'DERMAGA SUNGAI';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(item.source.operationalStatus);

    return InkWell(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 48), // Minimal 48 dp target sentuh
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              // Nomor urut 1, 2, 3 dalam kotak monospaced datar
              Container(
                width: 24,
                height: 24,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: TacticalColors.surface2,
                  border: Border.all(color: TacticalColors.borderSubtle, width: 1),
                  borderRadius: BorderRadius.circular(2),
                ),
                child: Text(
                  '$index',
                  style: const TextStyle(
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    color: TacticalColors.textPrimary,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Detail Nama & Tipe Sumber Air
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      item.source.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: TacticalColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            _formatSourceType(item.source.sourceType),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: TacticalColors.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${item.source.pressureBar.toStringAsFixed(1)}B',
                          style: const TextStyle(
                            fontSize: 10,
                            fontFamily: 'monospace',
                            color: TacticalColors.textMuted,
                            fontFeatures: [FontFeature.tabularFigures()],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // Jarak Meter & Status Operasional (NO PILL CHIPS)
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    item.formattedDistance,
                    style: const TextStyle(
                      fontSize: 13,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.w700,
                      color: TacticalColors.textPrimary,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(height: 2),
                  // Plain status text tanpa pill badge lonjong
                  Text(
                    _formatStatusText(item.source.operationalStatus),
                    style: TextStyle(
                      fontSize: 9,
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: statusColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
