// TASK-301 acceptance tests: token correctness, WCAG AAA contrast, tabular
// figures, and the structural bans (no pill chips, no hex outside the token
// file).
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_volunteer/design/hydratact_tokens.dart';

// ---------------------------------------------------------------------------
// WCAG 2.x relative luminance and contrast ratio.
// ---------------------------------------------------------------------------

double _srgbChannel(double channel01) {
  return channel01 <= 0.03928
      ? channel01 / 12.92
      : math.pow((channel01 + 0.055) / 1.055, 2.4).toDouble();
}

double _luminance(Color c) {
  final double r = _srgbChannel(c.r);
  final double g = _srgbChannel(c.g);
  final double b = _srgbChannel(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

double _contrastRatio(Color a, Color b) {
  final double la = _luminance(a);
  final double lb = _luminance(b);
  final double hi = math.max(la, lb);
  final double lo = math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/// docs/Design.md §3.1 — the three app surfaces.
const List<Color> _surfaces = <Color>[
  HydratactColors.surface0,
  HydratactColors.surface1,
  HydratactColors.surface2,
];

const List<String> _surfaceNames = <String>['surface-0', 'surface-1', 'surface-2'];

// ---------------------------------------------------------------------------
// 1. Documented palette matches docs/Design.md §3 exactly.
// ---------------------------------------------------------------------------

void main() {
  test('documented color tokens match Design.md hex values', () {
    final Map<Color, int> expected = <Color, int>{
      HydratactColors.surface0: 0xFF07090E,
      HydratactColors.surface1: 0xFF0D1117,
      HydratactColors.surface2: 0xFF161B22,
      HydratactColors.borderSubtle: 0xFF21262D,
      HydratactColors.borderActive: 0xFF30363D,
      HydratactColors.textPrimary: 0xFFF0F6FC,
      HydratactColors.textSecondary: 0xFF8B949E,
      HydratactColors.textMuted: 0xFF484F58,
      HydratactColors.attacker: 0xFFEF4444,
      HydratactColors.feeder: 0xFFF59E0B,
      HydratactColors.commander: 0xFF38BDF8,
      HydratactColors.barricade: 0xFFD946EF,
      HydratactColors.ready: 0xFF10B981,
      HydratactColors.lowDischarge: 0xFFF59E0B,
      HydratactColors.empty: 0xFF64748B,
      HydratactColors.damaged: 0xFFDC2626,
      HydratactColors.barricadeActiveBackground: 0x26D946EF,
      HydratactColors.mapLandBase: 0xFF0B0E14,
      HydratactColors.mapArterialRoad: 0xFF2D333B,
      HydratactColors.mapNarrowAlley: 0xFF484F58,
      HydratactColors.mapRiverFill: 0xFF0F2847,
      HydratactColors.mapRiverEdge: 0xFF1D4ED8,
    };
    expected.forEach((Color token, int hex) {
      expect(token.toARGB32(), hex, reason: 'token hex drifted');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. WCAG AAA: every text-tier token passes >= 7:1 on all three surfaces.
  // ---------------------------------------------------------------------------

  test('text-tier tokens pass WCAG AAA (7:1) on all surfaces', () {
    final Map<String, Color> textTokens = <String, Color>{
      'primary': HydratactText.primary,
      'secondary': HydratactText.secondary,
      'attacker': HydratactText.attacker,
      'feeder': HydratactText.feeder,
      'commander': HydratactText.commander,
      'barricade': HydratactText.barricade,
      'ready': HydratactText.ready,
      'lowDischarge': HydratactText.lowDischarge,
      'empty': HydratactText.empty,
      'damaged': HydratactText.damaged,
    };
    textTokens.forEach((String name, Color token) {
      for (int i = 0; i < _surfaces.length; i++) {
        final double ratio = _contrastRatio(_surfaces[i], token);
        expect(
          ratio,
          greaterThanOrEqualTo(7.0),
          reason: '$name on ${_surfaceNames[i]} is ${ratio.toStringAsFixed(2)}:1',
        );
      }
    });
  });

  test('documented textPrimary itself passes 7:1 on all surfaces', () {
    for (int i = 0; i < _surfaces.length; i++) {
      final double ratio = _contrastRatio(_surfaces[i], HydratactColors.textPrimary);
      expect(
        ratio,
        greaterThanOrEqualTo(7.0),
        reason: 'textPrimary on ${_surfaceNames[i]} is ${ratio.toStringAsFixed(2)}:1',
      );
    }
  });

  test('muted stays the documented disabled color (inactive text is exempt)', () {
    expect(HydratactText.muted.toARGB32(), HydratactColors.textMuted.toARGB32());
  });

  // ---------------------------------------------------------------------------
  // 3. Typography: telemetry styles are monospace with tabular figures.
  // ---------------------------------------------------------------------------

  test('mono styles use the monospace family with tabular figures', () {
    final List<TextStyle> monoStyles = <TextStyle>[
      HydratactTypography.telemetryGiant,
      HydratactTypography.eyebrow,
      HydratactTypography.status,
    ];
    for (final TextStyle style in monoStyles) {
      expect(style.fontFamily, HydratactTypography.monoFamily,
          reason: 'telemetry must render in monospace');
      final bool hasTabular = style.fontFeatures?.any((FontFeature f) => f.feature == 'tnum') ?? false;
      expect(hasTabular, isTrue, reason: 'numeric telemetry requires tabular figures');
    }
  });

  test('typography scale matches Design.md §4.2', () {
    expect(HydratactTypography.telemetryGiant.fontSize, 44);
    expect(HydratactTypography.telemetryGiant.fontWeight, FontWeight.w700);
    expect(HydratactTypography.h1.fontSize, 22);
    expect(HydratactTypography.h2.fontSize, 16);
    expect(HydratactTypography.body.fontSize, 14);
    expect(HydratactTypography.eyebrow.fontSize, 11);
    expect(HydratactTypography.eyebrow.letterSpacing, closeTo(1.65, 0.001)); // 0.15em @ 11px.
    expect(HydratactTypography.status.fontSize, 13);
  });

  // ---------------------------------------------------------------------------
  // 4. Touch targets and layout metrics (§1.2, §5, §7.2).
  // ---------------------------------------------------------------------------

  test('touch targets and layout metrics match Design.md', () {
    expect(HydratactDimensions.touchTargetMin, 48.0);
    expect(HydratactDimensions.waterStatusButtonHeight, 52.0);
    expect(HydratactDimensions.barricadeSwitchHeight, 56.0);
    expect(HydratactDimensions.pressureRequestButtonHeight, 64.0);
    expect(HydratactDimensions.criticalActionMinHeight, 56.0);
    expect(HydratactDimensions.criticalActionMaxHeight, 64.0);
    expect(HydratactDimensions.headerHeight, 56.0);
    expect(HydratactDimensions.mapFraction, 0.60);
    expect(HydratactDimensions.actionPanelFraction, 0.40);
    expect(HydratactDimensions.borderSubtleWidth, 1.0);
    expect(HydratactDimensions.noteRuleWidth, 2.0);
  });

  // ---------------------------------------------------------------------------
  // 5. Theme factory is assembled from tokens only.
  // ---------------------------------------------------------------------------

  test('buildHydratactTheme wires token colors', () {
    final ThemeData theme = buildHydratactTheme();
    expect(theme.brightness, Brightness.dark);
    expect(theme.scaffoldBackgroundColor.toARGB32(), HydratactColors.surface0.toARGB32());
    expect(theme.colorScheme.surface.toARGB32(), HydratactColors.surface1.toARGB32());
    expect(theme.dividerColor.toARGB32(), HydratactColors.borderSubtle.toARGB32());
  });

  // ---------------------------------------------------------------------------
  // 6. Structural bans across lib/.
  // ---------------------------------------------------------------------------

  test('no pill chips, oval badges, or stadium borders in lib/', () {
    final RegExp banned = RegExp(
      r'\b(Chip|ChoiceChip|InputChip|FilterChip|ActionChip|Badge|StadiumBorder)\s*\(',
    );
    for (final File file in _libDartFiles()) {
      final String source = file.readAsStringSync();
      final Match? hit = banned.firstMatch(source);
      expect(hit, isNull, reason: 'banned pill widget in ${file.path}: ${hit?.group(0)}');
    }
  });

  test('no hardcoded color literals outside the token file', () {
    final RegExp hexColor = RegExp(r'0x[0-9A-Fa-f]{6,8}|#[0-9A-Fa-f]{6}\b');
    final String tokenFile = 'lib${Platform.pathSeparator}design'
        '${Platform.pathSeparator}hydratact_tokens.dart';
    for (final File file in _libDartFiles()) {
      if (file.path.replaceAll('\\', '/').endsWith('design/hydratact_tokens.dart')) {
        continue;
      }
      final String source = file.readAsStringSync();
      expect(
        hexColor.hasMatch(source),
        isFalse,
        reason: 'hex literal found in ${file.path} — colors must come from the token file',
      );
    }
    expect(File(tokenFile).existsSync(), isTrue, reason: 'token file missing');
  });
}

List<File> _libDartFiles() {
  final Directory lib = Directory('lib');
  if (!lib.existsSync()) {
    return <File>[];
  }
  return lib
      .listSync(recursive: true)
      .whereType<File>()
      .where((File f) => f.path.endsWith('.dart'))
      .toList();
}
