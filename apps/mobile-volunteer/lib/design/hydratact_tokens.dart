// HydraTact tactical design tokens — the single source of color, typography,
// and touch-target dimensions for the volunteer field app.
//
// Provenance: docs/Design.md §3 (color tokens), §4 (typography scale),
// §5 (interactive component specs), §6 (offline map palette), §7.2 (mobile layout).
//
// Binding rules enforced by test/design_tokens_test.dart:
//   * No hex literals in widgets — every color must come from this file.
//   * No pill chips / oval badges (Chip, ChoiceChip, Badge, StadiumBorder).
//   * All numeric telemetry renders in monospace with tabular figures.
//   * Every TEXT color passes WCAG AAA (>= 7:1) against all three surfaces.
//     Where the documented hex falls short (measured, see HydratactText), a
//     corrected text-tier token is provided while the documented accent token
//     stays unchanged for borders, markers, and backgrounds.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Documented palette (docs/Design.md §3). Use for accents, borders, markers,
/// and backgrounds. For TEXT, prefer [HydratactText] which guarantees >= 7:1.
abstract final class HydratactColors {
  // 3.1 Surface hierarchy.
  static const Color surface0 = Color(0xFF07090E);
  static const Color surface1 = Color(0xFF0D1117);
  static const Color surface2 = Color(0xFF161B22);
  static const Color borderSubtle = Color(0xFF21262D);
  static const Color borderActive = Color(0xFF30363D);

  // 3.2 Text (documented hexes; see HydratactText for the text-safe tier).
  static const Color textPrimary = Color(0xFFF0F6FC);
  static const Color textSecondary = Color(0xFF8B949E);
  static const Color textMuted = Color(0xFF484F58); // disabled / inactive only.

  // 3.3 Role accents and spatial indicators.
  static const Color attacker = Color(0xFFEF4444);
  static const Color feeder = Color(0xFFF59E0B);
  static const Color commander = Color(0xFF38BDF8);
  static const Color barricade = Color(0xFFD946EF);

  // 3.4 Water source status.
  static const Color ready = Color(0xFF10B981);
  static const Color lowDischarge = Color(0xFFF59E0B);
  static const Color empty = Color(0xFF64748B);
  static const Color damaged = Color(0xFFDC2626);

  // 5.3 Barricade switch active fill: rgba(217, 70, 239, 0.15).
  static const Color barricadeActiveBackground = Color(0x26D946EF);

  // 7.2 Tactical header fills: role accent blended at 15% over surface-0
  // (measured: #2A1216 attacker, #2B1F0E feeder). Header text must be
  // [HydratactText.primary] (contrast 16.1:1 and 14.8:1 respectively).
  static const Color attackerHeaderBackground = Color(0xFF2A1216);
  static const Color feederHeaderBackground = Color(0xFF2B1F0E);

  // 6.1 Offline vector map palette.
  static const Color mapLandBase = Color(0xFF0B0E14);
  static const Color mapArterialRoad = Color(0xFF2D333B);
  static const Color mapNarrowAlley = Color(0xFF484F58);
  static const Color mapRiverFill = Color(0xFF0F2847);
  static const Color mapRiverEdge = Color(0xFF1D4ED8);
  static const Color mapBuildingFill = surface2;
}

/// Text-tier tokens: every entry passes WCAG AAA (>= 7:1) against all three
/// surfaces (#07090E, #0D1117, #161B22). Measured ratios are asserted in
/// test/design_tokens_test.dart.
///
/// Corrections vs the documented accents (kept, not replaced — the accent hexes
/// above stay valid for non-text uses):
///   * secondary  #9DA7B3 — documented #8B949E measures 6.47:1 / 6.15:1 / 5.62:1.
///   * attacker   #FF8A8A — documented #EF4444 measures 5.29:1 as text.
///   * barricade  #E879F9 — documented #D946EF measures 5.76:1 as text.
///   * ready      #34D399 — documented #10B981 measures 6.82:1 on surface-2.
///   * empty      #9CA9B9 — documented #64748B measures 3.98:1 as text.
///   * damaged    #FF8A8A — documented #DC2626 measures 3.92:1 as text.
///   * muted is the documented disabled color; inactive text is exempt from
///     WCAG contrast requirements, so it stays exactly as documented.
abstract final class HydratactText {
  static const Color primary = HydratactColors.textPrimary;
  static const Color secondary = Color(0xFF9DA7B3);
  static const Color muted = HydratactColors.textMuted;

  static const Color attacker = Color(0xFFFF8A8A);
  static const Color feeder = HydratactColors.feeder; // 9.27 / 8.81 / 8.05 — passes as-is.
  static const Color commander = HydratactColors.commander; // 9.30 / 8.83 / 8.07 — passes as-is.
  static const Color barricade = Color(0xFFE879F9);

  static const Color ready = Color(0xFF34D399);
  static const Color lowDischarge = HydratactColors.lowDischarge; // passes as-is.
  static const Color empty = Color(0xFF9CA9B9);
  static const Color damaged = Color(0xFFFF8A8A);
}

/// Typography scale (docs/Design.md §4.2). Telemetry styles are monospace with
/// tabular figures; UI copy uses the system sans-serif family.
abstract final class HydratactTypography {
  /// System monospace per Design.md §4.1 ("System Monospace" is an allowed
  /// family; bundling JetBrains Mono would add asset weight for no AC gain).
  static const String monoFamily = 'monospace';

  /// Applies Design.md rule 3: all numeric telemetry uses tabular figures.
  static const List<FontFeature> _tabular = <FontFeature>[FontFeature.tabularFigures()];

  /// Telemetry Giant — 44/48 bold mono. Tank liters, distance meters.
  static final TextStyle telemetryGiant = _mono(
    fontSize: 44,
    height: 48 / 44,
    fontWeight: FontWeight.w700,
  );

  /// Label / Eyebrow — 11/14 bold mono, letterspacing 0.15em.
  /// Callers pass already-uppercased strings (no text-transform in Flutter).
  static final TextStyle eyebrow = _mono(
    fontSize: 11,
    height: 14 / 11,
    fontWeight: FontWeight.w700,
    letterSpacing: 11 * 0.15,
    color: HydratactText.secondary,
  );

  /// Status line — 13/16 bold mono, plain text, no pill container (§2.2.3).
  static final TextStyle status = _mono(
    fontSize: 13,
    height: 16 / 13,
    fontWeight: FontWeight.w700,
  );

  /// Headline H1 — 22/28 bold sans. Screen title, active incident location.
  static const TextStyle h1 = TextStyle(
    fontSize: 22,
    height: 28 / 22,
    fontWeight: FontWeight.w700,
  );

  /// Section Title H2 — 16/22 semibold sans. Panel headers.
  static const TextStyle h2 = TextStyle(
    fontSize: 16,
    height: 22 / 16,
    fontWeight: FontWeight.w600,
  );

  /// Body Data — 14/20 regular sans. Addresses, posko names, route instructions.
  static const TextStyle body = TextStyle(
    fontSize: 14,
    height: 20 / 14,
    fontWeight: FontWeight.w400,
  );

  static TextStyle _mono({
    required double fontSize,
    required double height,
    required FontWeight fontWeight,
    double? letterSpacing,
    Color? color,
  }) {
    return TextStyle(
      fontFamily: monoFamily,
      fontSize: fontSize,
      height: height,
      fontWeight: fontWeight,
      letterSpacing: letterSpacing,
      color: color,
      fontFeatures: _tabular,
    );
  }
}

/// Touch targets and layout metrics (docs/Design.md §1.2, §5, §7.2).
abstract final class HydratactDimensions {
  // Touch targets.
  static const double touchTargetMin = 48.0;
  static const double waterStatusButtonHeight = 52.0;
  static const double barricadeSwitchHeight = 56.0;
  static const double criticalActionMinHeight = 56.0;
  static const double criticalActionMaxHeight = 64.0;
  static const double pressureRequestButtonHeight = 64.0;

  // 7.2 Mobile layout.
  static const double headerHeight = 56.0;
  static const double mapFraction = 0.60;
  static const double actionPanelFraction = 0.40;

  // Flat fields: 1 px borders, 2 px vertical rule for explanatory notes.
  static const double borderSubtleWidth = 1.0;
  static const double noteRuleWidth = 2.0;

  // 6.2 Marker sizes.
  static const double fireMarkerSize = 32.0;
  static const double unitMarkerSize = 28.0;
  static const double waterMarkerSize = 24.0;
}

/// App theme assembled exclusively from tokens in this file.
ThemeData buildHydratactTheme() {
  final ColorScheme scheme = ColorScheme.dark(
    primary: HydratactColors.commander,
    secondary: HydratactColors.commander,
    surface: HydratactColors.surface1,
    error: HydratactColors.damaged,
    onPrimary: HydratactText.primary,
    onSecondary: HydratactText.primary,
    onSurface: HydratactText.primary,
    onError: HydratactText.primary,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: scheme,
    scaffoldBackgroundColor: HydratactColors.surface0,
    canvasColor: HydratactColors.surface1,
    dividerColor: HydratactColors.borderSubtle,
    textTheme: TextTheme(
      displayLarge: HydratactTypography.telemetryGiant,
      headlineMedium: HydratactTypography.h1,
      titleMedium: HydratactTypography.h2,
      bodyMedium: HydratactTypography.body,
      labelSmall: HydratactTypography.eyebrow,
    ),
  );
}
