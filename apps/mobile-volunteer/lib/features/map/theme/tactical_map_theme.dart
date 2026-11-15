import 'package:vector_tile_renderer/vector_tile_renderer.dart';

/// Tactical Map Theme for HydraTact Samarinda
/// Palet terang selaras web dashboard komando (TacticalMapCanvas.tsx):
/// - Latar Dasar Daratan: #F2EFE9 (TacticalColors.mapBackground, gaya OSM Standard)
/// - Jaringan Jalan Arteri (>= 6 m): #B5AEA2 (TacticalColors.mapRoadArtery)
/// - Jaringan Gang Sempit (< 2.5 m): #D8D3C9 (TacticalColors.mapAlley)
/// - Koridor Sungai Karang Mumus: #AAD3DF dengan tepian #0284C7 (TacticalColors.mapRiver, mapRiverBank)
/// - Bangunan Permukiman Padat: #E0DFDB (TacticalColors.mapBuilding)
class TacticalMapTheme {
  TacticalMapTheme._();

  static const String sourceId = 'samarinda';

  /// Mapbox GL Style JSON specification for tactical light command vector tiles
  static Map<String, dynamic> themeData({String source = sourceId}) {
    return {
      'version': 8,
      'name': 'Tactical Samarinda Command Light',
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
            'background-color': '#F2EFE9',
          },
        },
        // 2. Bangunan Permukiman Padat
        {
          'id': 'buildings',
          'type': 'fill',
          'source': source,
          'source-layer': 'buildings',
          'paint': {
            'fill-color': '#E0DFDB',
            'fill-opacity': 0.9,
            'fill-outline-color': '#CFC9BE',
          },
        },
        // 3. Koridor Sungai Karang Mumus (Area/Fill jika poligon)
        {
          'id': 'waterways-fill',
          'type': 'fill',
          'source': source,
          'source-layer': 'waterways',
          'paint': {
            'fill-color': '#AAD3DF',
            'fill-opacity': 0.95,
            'fill-outline-color': '#0284C7',
          },
        },
        // 4. Koridor Sungai Karang Mumus (Garis Aliran)
        {
          'id': 'waterways-line',
          'type': 'line',
          'source': source,
          'source-layer': 'waterways',
          'paint': {
            'line-color': '#0284C7',
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
            'line-color': '#B5AEA2',
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
            'line-color': '#D8D3C9',
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
            'line-color': '#C9C3B8',
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
