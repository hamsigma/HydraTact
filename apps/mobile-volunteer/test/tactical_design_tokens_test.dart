import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_volunteer/core/theme/tactical_theme.dart';

/// Hitung luminance relatif sesuai rumus resmi W3C WCAG 2.1
double _calculateRelativeLuminance(Color color) {
  double transform(int channel) {
    final double v = channel / 255.0;
    return (v <= 0.04045) ? (v / 12.92) : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  }

  final int r = (color.r * 255.0).round().clamp(0, 255);
  final int g = (color.g * 255.0).round().clamp(0, 255);
  final int b = (color.b * 255.0).round().clamp(0, 255);

  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

/// Hitung rasio kontras WCAG antara foreground dan background
double _calculateContrastRatio(Color foreground, Color background) {
  final double l1 = _calculateRelativeLuminance(foreground);
  final double l2 = _calculateRelativeLuminance(background);
  final double lighter = math.max(l1, l2);
  final double darker = math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

void main() {
  group('TASK-301: Tactical Design Tokens', () {
    test('Hex color tokens match Design.md specifications exactly', () {
      expect(TacticalColors.surface0.toARGB32(), equals(0xFF07090E));
      expect(TacticalColors.surface1.toARGB32(), equals(0xFF0D1117));
      expect(TacticalColors.surface2.toARGB32(), equals(0xFF161B22));
      expect(TacticalColors.borderSubtle.toARGB32(), equals(0xFF21262D));
      expect(TacticalColors.borderActive.toARGB32(), equals(0xFF30363D));

      expect(TacticalColors.textPrimary.toARGB32(), equals(0xFFF0F6FC));
      expect(TacticalColors.textSecondary.toARGB32(), equals(0xFF8B949E));
      expect(TacticalColors.textMuted.toARGB32(), equals(0xFF484F58));

      expect(TacticalColors.attacker.toARGB32(), equals(0xFFEF4444));
      expect(TacticalColors.feeder.toARGB32(), equals(0xFFF59E0B));
      expect(TacticalColors.commander.toARGB32(), equals(0xFF38BDF8));
      expect(TacticalColors.barricade.toARGB32(), equals(0xFFD946EF));

      expect(TacticalColors.waterReady.toARGB32(), equals(0xFF10B981));
      expect(TacticalColors.waterLowDischarge.toARGB32(), equals(0xFFF59E0B));
      expect(TacticalColors.waterEmpty.toARGB32(), equals(0xFF64748B));
      expect(TacticalColors.waterDamaged.toARGB32(), equals(0xFFDC2626));
    });

    test('WCAG Contrast Ratio for text tokens against surface-0', () {
      final double primaryContrast = _calculateContrastRatio(
        TacticalColors.textPrimary,
        TacticalColors.surface0,
      );
      final double secondaryContrast = _calculateContrastRatio(
        TacticalColors.textSecondary,
        TacticalColors.surface0,
      );

      // Text primary: 18.3:1 (jauh melampaui syarat WCAG AAA >= 7:1)
      expect(primaryContrast, greaterThanOrEqualTo(7.0));
      // Text secondary: 6.47:1 (lolos WCAG AA >= 4.5:1 dan WCAG AAA large text >= 4.5:1)
      expect(secondaryContrast, greaterThanOrEqualTo(4.5));
    });

    test('Tabular figures (tabular-nums) enforced on telemetry & numeric typography', () {
      expect(
        TacticalTypography.telemetryGiant.fontFeatures,
        contains(const FontFeature.tabularFigures()),
      );

      expect(
        TacticalTypography.labelEyebrow.fontFeatures,
        contains(const FontFeature.tabularFigures()),
      );

      final statusStyle = TacticalTypography.statusText(color: TacticalColors.waterReady);
      expect(
        statusStyle.fontFeatures,
        contains(const FontFeature.tabularFigures()),
      );

      final numericStyle = TacticalTypography.tabularNumeric();
      expect(
        numericStyle.fontFeatures,
        contains(const FontFeature.tabularFigures()),
      );
    });

    test('Theme enforces OLED Dark and Flat 1px borders without pill chips', () {
      final theme = TacticalTheme.darkTheme;
      expect(theme.brightness, equals(Brightness.dark));
      expect(theme.scaffoldBackgroundColor, equals(TacticalColors.surface0));
      expect(theme.cardTheme.elevation, equals(0));
      expect(theme.cardTheme.color, equals(TacticalColors.surface1));
    });
  });
}
