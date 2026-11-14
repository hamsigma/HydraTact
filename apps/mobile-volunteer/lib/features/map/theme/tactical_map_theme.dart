import 'package:vector_tile_renderer/vector_tile_renderer.dart';

/// Tactical Map Theme for HydraTact Samarinda
/// Sesuai spesifikasi docs/Design.md Bagian 6.1:
/// - Latar Dasar Daratan: #0B0E14 (TacticalColors.mapBackground)
/// - Jaringan Jalan Arteri (>= 6 m): #2D333B (TacticalColors.mapRoadArtery)
/// - Jaringan Gang Sempit (< 2.5 m): #484F58 (TacticalColors.mapAlley)
/// - Koridor Sungai Karang Mumus: #0F2847 dengan tepian #1D4ED8 (TacticalColors.mapRiver, mapRiverBank)
/// - Bangunan Permukiman Padat: #161B22 (TacticalColors.mapBuilding)
class TacticalMapTheme {
  TacticalMapTheme._();

  static const String sourceId = 'samarinda';

  /// Mapbox GL Style JSON specification for tactical dark OLED vector tiles
  static Map<String, dynamic> themeData({String source = sourceId}) {
    return {
      'version': 8,
      'name': 'Tactical Samarinda OLED Dark',
      'sources': {
        source: {
          'type': 'vector',
        },
      },
      'layers': [
        // 1. Background (Daratan)
        {
          'id': 'background',
          'type': 'background',
          'paint': {
            'background-color': '#0B0E14',
          },
        },
        // 2. Bangunan Permukiman Padat
        {
          'id': 'buildings',
          'type': 'fill',
          'source': source,
          'source-layer': 'buildings',
          'paint': {
            'fill-color': '#161B22',
            'fill-opacity': 0.85,
            'fill-outline-color': '#21262D',
          },
        },
        // 3. Koridor Sungai Karang Mumus (Area/Fill jika poligon)
        {
          'id': 'waterways-fill',
          'type': 'fill',
          'source': source,
          'source-layer': 'waterways',
          'paint': {
            'fill-color': '#0F2847',
            'fill-opacity': 0.9,
            'fill-outline-color': '#1D4ED8',
          },
        },
        // 4. Koridor Sungai Karang Mumus (Garis Aliran)
        {
          'id': 'waterways-line',
          'type': 'line',
          'source': source,
          'source-layer': 'waterways',
          'paint': {
            'line-color': '#1D4ED8',
            'line-width': 5.0,
            'line-opacity': 0.95,
          },
        },
        // 5. Jaringan Jalan Arteri (>= 6 m)
        {
          'id': 'roads-artery',
          'type': 'line',
          'source': source,
          'source-layer': 'roads',
          'filter': ['>=', 'road_width_meters', 6.0],
          'paint': {
            'line-color': '#2D333B',
            'line-width': 4.0,
          },
        },
        // 6. Jaringan Gang Sempit (< 2.5 m)
        {
          'id': 'roads-alley',
          'type': 'line',
          'source': source,
          'source-layer': 'roads',
          'filter': ['<', 'road_width_meters', 2.5],
          'paint': {
            'line-color': '#484F58',
            'line-width': 2.0,
          },
        },
        // 7. Seluruh Jaringan Jalan Default (Fallback jika tanpa atribut lebar)
        {
          'id': 'roads-default',
          'type': 'line',
          'source': source,
          'source-layer': 'roads',
          'paint': {
            'line-color': '#3A424E',
            'line-width': 2.5,
          },
        },
      ],
    };
  }

  /// Builds a compiled vector tile [Theme]
  static Theme buildTheme({String source = sourceId, Logger? logger}) {
    return ThemeReader(logger: logger).read(themeData(source: source));
  }
}
