import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/theme/tactical_colors.dart';
import '../../../core/theme/tactical_typography.dart';
import '../../../core/network/models/enums.dart';

/// Marker Spasial Armada dan Lokasi sesuai docs/Design.md Bagian 6.2
/// Mematuhi aturan Strict: BANNED PILL CHIPS & OVAL BADGES.

/// Marker Titik Api / Pusat Insiden (32 x 32 dp)
class IncidentFireMarkerWidget extends StatelessWidget {
  const IncidentFireMarkerWidget({
    super.key,
    this.size = 32.0,
    this.label,
  });

  final double size;
  final String? label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: TacticalColors.attacker,
            border: Border.fromBorderSide(
              BorderSide(color: TacticalColors.surface1, width: 2),
            ),
          ),
          child: const Center(
            child: Icon(
              Icons.local_fire_department,
              color: TacticalColors.surface1,
              size: 20,
            ),
          ),
        ),
        if (label != null) ...[
          const SizedBox(height: 2),
          Text(
            label!,
            maxLines: 1,
            softWrap: false,
            style: TacticalTypography.labelEyebrow.copyWith(
              color: TacticalColors.attacker,
              fontSize: 10,
            ),
          ),
        ],
      ],
    );
  }
}

/// Marker Unit ATTACKER (Segitiga arah navigasi 28 dp berputar sesuai kompas)
class AttackerMarkerWidget extends StatelessWidget {
  const AttackerMarkerWidget({
    super.key,
    this.bearingDegrees = 0.0,
    this.unitCode = 'ATK-01',
    this.size = 28.0,
  });

  final double bearingDegrees;
  final String unitCode;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Transform.rotate(
          angle: (bearingDegrees * math.pi) / 180.0,
          child: CustomPaint(
            size: Size(size, size),
            painter: _TrianglePainter(color: TacticalColors.attacker),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          unitCode,
          maxLines: 1,
          softWrap: false,
          style: TacticalTypography.labelEyebrow.copyWith(
            color: TacticalColors.attacker,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

/// Marker Unit FEEDER (Lingkaran kuning 28 dp terkunci di arteri utama)
class FeederMarkerWidget extends StatelessWidget {
  const FeederMarkerWidget({
    super.key,
    this.unitCode = 'FDR-01',
    this.size = 28.0,
  });

  final String unitCode;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: TacticalColors.feeder,
            border: Border.fromBorderSide(
              BorderSide(color: TacticalColors.surface1, width: 2),
            ),
          ),
          child: const Center(
            child: Icon(
              Icons.local_shipping,
              color: TacticalColors.surface1,
              size: 16,
            ),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          unitCode,
          maxLines: 1,
          softWrap: false,
          style: TacticalTypography.labelEyebrow.copyWith(
            color: TacticalColors.feeder,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

/// Marker Sumber Air (Tetesan air 24 dp dengan warna status & angka jarak meter)
class WaterSourceMarkerWidget extends StatelessWidget {
  const WaterSourceMarkerWidget({
    super.key,
    required this.status,
    required this.distanceMeters,
    this.size = 24.0,
  });

  final WaterSourceStatus status;
  final int distanceMeters;
  final double size;

  Color get _statusColor {
    switch (status) {
      case WaterSourceStatus.READY:
        return TacticalColors.waterReady;
      case WaterSourceStatus.LOW_DISCHARGE:
        return TacticalColors.waterLowDischarge;
      case WaterSourceStatus.EMPTY:
        return TacticalColors.waterEmpty;
      case WaterSourceStatus.DAMAGED:
        return TacticalColors.waterDamaged;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _statusColor,
            border: const Border.fromBorderSide(
              BorderSide(color: TacticalColors.surface1, width: 1.5),
            ),
          ),
          child: Center(
            child: Icon(
              Icons.water_drop,
              color: TacticalColors.surface1,
              size: 14,
            ),
          ),
        ),
        const SizedBox(height: 1),
        Text(
          '${distanceMeters}m',
          maxLines: 1,
          softWrap: false,
          style: TacticalTypography.tabularNumeric(
            color: _statusColor,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

class _TrianglePainter extends CustomPainter {
  _TrianglePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = TacticalColors.surface0
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path()
      ..moveTo(size.width / 2, 0)
      ..lineTo(size.width, size.height)
      ..lineTo(size.width / 2, size.height * 0.75)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(path, paint);
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant _TrianglePainter oldDelegate) =>
      oldDelegate.color != color;
}
