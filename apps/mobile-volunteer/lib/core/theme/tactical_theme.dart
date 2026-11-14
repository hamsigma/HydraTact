import 'package:flutter/material.dart';
import 'tactical_colors.dart';
import 'tactical_typography.dart';

export 'tactical_colors.dart';
export 'tactical_typography.dart';

/// HydraTact Samarinda Tactical OLED Dark Theme Data
/// Sesuai aturan Design.md:
/// - Latar belakang OLED pekat (#07090E)
/// - Kontras WCAG AAA (>= 7:1)
/// - Border datar 1 px tanpa gradien dan tanpa kartu berlapis
/// - Larangan mutlak pill chip / badge oval
class TacticalTheme {
  TacticalTheme._();

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: TacticalColors.surface0,
      canvasColor: TacticalColors.surface0,
      cardColor: TacticalColors.surface1,
      dividerColor: TacticalColors.borderSubtle,

      colorScheme: const ColorScheme(
        brightness: Brightness.dark,
        primary: TacticalColors.commander,
        onPrimary: TacticalColors.surface0,
        secondary: TacticalColors.feeder,
        onSecondary: TacticalColors.surface0,
        error: TacticalColors.attacker,
        onError: TacticalColors.surface0,
        surface: TacticalColors.surface1,
        onSurface: TacticalColors.textPrimary,
        outline: TacticalColors.borderSubtle,
        outlineVariant: TacticalColors.borderActive,
      ),

      // Card Theme: Bidang datar dengan border 1 px, tanpa sudut sangat bulat
      cardTheme: CardThemeData(
        color: TacticalColors.surface1,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(2.0),
          side: const BorderSide(
            color: TacticalColors.borderSubtle,
            width: 1.0,
          ),
        ),
      ),

      // Button Themes: Target sentuh >= 48x48 dp, batas tegas
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2.0),
          ),
          textStyle: TacticalTypography.headlineH1.copyWith(
            fontSize: 14.0,
            letterSpacing: 0.5,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          side: const BorderSide(
            color: TacticalColors.borderSubtle,
            width: 1.0,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(2.0),
          ),
        ),
      ),

      // App Bar Theme: Tinggi 56 dp, latar surface-0
      appBarTheme: const AppBarTheme(
        backgroundColor: TacticalColors.surface0,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        toolbarHeight: 56.0,
        titleTextStyle: TacticalTypography.headlineH1,
        iconTheme: IconThemeData(
          color: TacticalColors.textPrimary,
          size: 24.0,
        ),
      ),

      // Text Theme
      textTheme: const TextTheme(
        displayLarge: TacticalTypography.telemetryGiant,
        headlineLarge: TacticalTypography.headlineH1,
        titleMedium: TacticalTypography.sectionTitleH2,
        bodyMedium: TacticalTypography.bodyData,
        labelSmall: TacticalTypography.labelEyebrow,
      ),
    );
  }
}
