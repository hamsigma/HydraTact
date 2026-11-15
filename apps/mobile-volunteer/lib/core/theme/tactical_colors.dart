import 'package:flutter/material.dart';

/// HydraTact Samarinda Command Dashboard Light Design System Colors
/// Palet warna diselaraskan dengan web dashboard komando
/// (apps/web-command TacticalMapCanvas.tsx): permukaan putih/slate terang,
/// aksen status merah-amber-emerald-fuchsia.
class TacticalColors {
  TacticalColors._();

  // 3.1 Warna Latar Belakang (Surface Hierarchy — terang seperti web komando)
  /// Base Canvas: Area peta & latar utama (#E2E8F0 slate-200)
  static const Color surface0 = Color(0xFFE2E8F0);

  /// Card Surface: Panel HUD, kartu data, header (#FFFFFF)
  static const Color surface1 = Color(0xFFFFFFFF);

  /// Overlay Surface: Baris terpilih, sheet aksi (#F1F5F9 slate-100)
  static const Color surface2 = Color(0xFFF1F5F9);

  /// Surface Border: Garis pembatas 1 px antar panel (#CBD5E1 slate-300)
  static const Color borderSubtle = Color(0xFFCBD5E1);

  /// Surface Border Active: Garis panel aktif (#94A3B8 slate-400)
  static const Color borderActive = Color(0xFF94A3B8);

  // 3.2 Tipografi dan Teks
  /// Text Primary: teks utama gelap (#0F172A slate-900)
  static const Color textPrimary = Color(0xFF0F172A);

  /// Text Secondary: teks pendukung (#475569 slate-600)
  static const Color textSecondary = Color(0xFF475569);

  /// Text Muted / Disabled: teks non-interaktif (#64748B slate-500)
  static const Color textMuted = Color(0xFF64748B);

  // 3.3 Aksen Peran Lapangan dan Indikator Spasial (warna web komando)
  /// Peran ATTACKER / Titik Api: merah (red-600 #DC2626)
  static const Color attacker = Color(0xFFDC2626);

  /// Peran FEEDER / Debit Lemah: amber (amber-600 #D97706)
  static const Color feeder = Color(0xFFD97706);

  /// Peran COMMANDER / Koridor Sungai: sky (sky-700 #0284C7)
  static const Color commander = Color(0xFF0284C7);

  /// Garis Barikade Selang: fuchsia (fuchsia-600 #C026D3)
  static const Color barricade = Color(0xFFC026D3);

  /// Latar Belakang Barikade Aktif: rgba(192, 38, 211, 0.10)
  static const Color barricadeActiveBg = Color(0x1AC026D3);

  /// Latar lembut badge Peran ATTACKER: rgba(220, 38, 38, 0.10)
  static const Color attackerSoftBg = Color(0x1ADC2626);

  /// Latar lembut badge Peran FEEDER: rgba(217, 119, 6, 0.10)
  static const Color feederSoftBg = Color(0x1AD97706);

  /// Tombol terpilih (HUD): latar slate-900 #0F172A
  static const Color selectedControlBg = Color(0xFF0F172A);

  /// Teks pada tombol terpilih: #FFFFFF
  static const Color selectedControlText = Color(0xFFFFFFFF);

  // 3.4 Status Logistik Air (Water Source Status — warna web komando)
  /// READY: Hijau Emerald; debit air deras >= 4.0 Bar (emerald-600 #059669)
  static const Color waterReady = Color(0xFF059669);

  /// LOW_DISCHARGE: Amber peringatan; debit air lemah < 2.0 Bar (amber-600 #D97706)
  static const Color waterLowDischarge = Color(0xFFD97706);

  /// EMPTY: Slate redup; tandon kering / hidran mati (slate-500 #64748B)
  static const Color waterEmpty = Color(0xFF64748B);

  /// DAMAGED: Merah padam; fisik rusak (red-600 #DC2626)
  static const Color waterDamaged = Color(0xFFDC2626);

  // 6.1 Lapisan Peta Vektor Luring (gaya OpenStreetMap terang)
  /// Daratan luring: krem khas OSM Standard (#F2EFE9)
  static const Color mapBackground = Color(0xFFF2EFE9);

  /// Jalan arteri (>= 6 m): abu-abu hangat (#B5AEA2)
  static const Color mapRoadArtery = Color(0xFFB5AEA2);

  /// Gang sempit (< 2.5 m): abu terang (#D8D3C9)
  static const Color mapAlley = Color(0xFFD8D3C9);

  /// Jalan default (fallback): (#C9C3B8)
  static const Color mapRoadDefault = Color(0xFFC9C3B8);

  /// Koridor Sungai Karang Mumus: biru muda OSM (#AAD3DF)
  static const Color mapRiver = Color(0xFFAAD3DF);

  /// Tepian/isi garis sungai: sky-700 (#0284C7)
  static const Color mapRiverBank = Color(0xFF0284C7);

  /// Bangunan Permukiman Padat: (#E0DFDB)
  static const Color mapBuilding = Color(0xFFE0DFDB);
}
