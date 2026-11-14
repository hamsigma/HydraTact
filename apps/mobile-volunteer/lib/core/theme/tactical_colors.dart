import 'package:flutter/material.dart';

/// HydraTact Samarinda Tactical OLED Dark Design System Colors
/// Sesuai spesifikasi docs/Design.md Bagian 3 & Aturan Desain
class TacticalColors {
  TacticalColors._();

  // 3.1 Warna Latar Belakang (Surface Hierarchy)
  /// Base Canvas: Latar belakang utama seluruh aplikasi (#07090E)
  static const Color surface0 = Color(0xFF07090E);

  /// Card Surface: Permukaan panel data, kartu unit, dan lembar kontrol (#0D1117)
  static const Color surface1 = Color(0xFF0D1117);

  /// Overlay Surface: Dialog konfirmasi, modal, dan sheet aksi (#161B22)
  static const Color surface2 = Color(0xFF161B22);

  /// Surface Border: Garis pembatas 1 px antar panel data (#21262D)
  static const Color borderSubtle = Color(0xFF21262D);

  /// Surface Border Active: Garis pembatas panel yang sedang aktif (#30363D)
  static const Color borderActive = Color(0xFF30363D);

  // 3.2 Tipografi dan Teks Kontras Tinggi (WCAG AAA >= 7:1)
  /// Text Primary: Kontras 15.8:1 terhadap #07090E (#F0F6FC)
  static const Color textPrimary = Color(0xFFF0F6FC);

  /// Text Secondary: Kontras 7.2:1 terhadap #07090E (#8B949E)
  static const Color textSecondary = Color(0xFF8B949E);

  /// Text Muted / Disabled: Teks tidak aktif / non-interaktif (#484F58)
  static const Color textMuted = Color(0xFF484F58);

  // 3.3 Aksen Peran Lapangan dan Indikator Spasial
  /// Peran ATTACKER: Unit serbu gang sempit dan tombol darurat (#EF4444)
  static const Color attacker = Color(0xFFEF4444);

  /// Peran FEEDER: Truk tangki pengumpan di jalan arteri (#F59E0B)
  static const Color feeder = Color(0xFFF59E0B);

  /// Peran COMMANDER / Taktis: Penanda fokus peta dan kueri operator (#38BDF8)
  static const Color commander = Color(0xFF38BDF8);

  /// Garis Barikade Selang: Fuchsia neon (#D946EF)
  static const Color barricade = Color(0xFFD946EF);

  /// Latar Belakang Barikade Aktif: rgba(217, 70, 239, 0.15)
  static const Color barricadeActiveBg = Color(0x26D946EF);

  // 3.4 Status Logistik Air (Water Source Status)
  /// READY: Hijau Emerald; debit air deras >= 4.0 Bar (#10B981)
  static const Color waterReady = Color(0xFF10B981);

  /// LOW_DISCHARGE: Amber peringatan; debit air lemah < 2.0 Bar (#F59E0B)
  static const Color waterLowDischarge = Color(0xFFF59E0B);

  /// EMPTY: Slate redup; tandon kering / hidran mati (#64748B)
  static const Color waterEmpty = Color(0xFF64748B);

  /// DAMAGED: Merah padam; fisik rusak (#DC2626)
  static const Color waterDamaged = Color(0xFFDC2626);

  // 6.1 Lapisan Peta Vektor Luring
  static const Color mapBackground = Color(0xFF0B0E14);
  static const Color mapRoadArtery = Color(0xFF2D333B);
  static const Color mapAlley = Color(0xFF484F58);
  static const Color mapRiver = Color(0xFF0F2847);
  static const Color mapRiverBank = Color(0xFF1D4ED8);
  static const Color mapBuilding = Color(0xFF161B22);
}
