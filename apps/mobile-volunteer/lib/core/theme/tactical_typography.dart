import 'package:flutter/material.dart';
import 'tactical_colors.dart';

/// HydraTact Samarinda Tactical Typography Specification
/// Sesuai spesifikasi docs/Design.md Bagian 4 & Aturan Desain
class TacticalTypography {
  TacticalTypography._();

  static const String monospaceFamily = 'RobotoMono';
  static const String sansFamily = 'Roboto';

  /// Telemetry Giant: 44 px / 48 px, Bold 700 Monospace, tabular-nums
  /// Untuk angka sisa air tangki (Liter) & jarak meter gang
  static const TextStyle telemetryGiant = TextStyle(
    fontFamily: monospaceFamily,
    fontSize: 44.0,
    height: 48.0 / 44.0,
    fontWeight: FontWeight.w700,
    color: TacticalColors.textPrimary,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  /// Headline H1: 22 px / 28 px, Bold 700 Sans
  /// Untuk judul layar utama, nama lokasi kejadian aktif
  static const TextStyle headlineH1 = TextStyle(
    fontFamily: sansFamily,
    fontSize: 22.0,
    height: 28.0 / 22.0,
    fontWeight: FontWeight.w700,
    color: TacticalColors.textPrimary,
  );

  /// Section Title H2: 16 px / 22 px, Semibold 600 Sans
  /// Untuk header panel unit armada & daftar sumber air
  static const TextStyle sectionTitleH2 = TextStyle(
    fontFamily: sansFamily,
    fontSize: 16.0,
    height: 22.0 / 16.0,
    fontWeight: FontWeight.w600,
    color: TacticalColors.textPrimary,
  );

  /// Body Data: 14 px / 20 px, Regular 400 Sans
  /// Untuk alamat lokasi, nama posko, instruksi rute
  static const TextStyle bodyData = TextStyle(
    fontFamily: sansFamily,
    fontSize: 14.0,
    height: 20.0 / 14.0,
    fontWeight: FontWeight.w400,
    color: TacticalColors.textSecondary,
  );

  /// Label / Eyebrow: 11 px / 14 px, Bold 700 Monospace, uppercase tracking 0.15em
  /// Untuk kode unit (ATK-04), status operasional, stempel waktu
  static const TextStyle labelEyebrow = TextStyle(
    fontFamily: monospaceFamily,
    fontSize: 11.0,
    height: 14.0 / 11.0,
    fontWeight: FontWeight.w700,
    letterSpacing: 1.65, // 0.15em of 11px
    color: TacticalColors.textSecondary,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  /// Status Operasional Polos (Plain-Text Monospace Bold, No-Pill)
  static TextStyle statusText({required Color color, double fontSize = 13.0}) {
    return TextStyle(
      fontFamily: monospaceFamily,
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      color: color,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }

  /// Numeric Tabular Text Helper untuk semua angka metrik (jarak meter, liter, bar, detik)
  static TextStyle tabularNumeric({
    double fontSize = 14.0,
    FontWeight fontWeight = FontWeight.w700,
    Color color = TacticalColors.textPrimary,
  }) {
    return TextStyle(
      fontFamily: monospaceFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }
}
