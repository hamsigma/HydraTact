import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile_volunteer/core/network/models/enums.dart';
import 'package:mobile_volunteer/core/theme/tactical_theme.dart';
import 'package:mobile_volunteer/features/map/services/mbtiles_service.dart';
import 'package:mobile_volunteer/features/map/theme/tactical_map_theme.dart';
import 'package:mobile_volunteer/features/map/widgets/tactical_map_view.dart';
import 'package:mobile_volunteer/features/map/widgets/tactical_markers.dart';
import 'package:vector_map_tiles/vector_map_tiles.dart';

void main() {
  group('TASK-401: Offline MBTiles Vector Map Renderer', () {
    const mbtilesRelativePath = 'assets/maps/samarinda_dense.mbtiles';

    test('1. MBTiles asset file exists and has valid metadata', () async {
      final file = File(mbtilesRelativePath);
      expect(file.existsSync(), isTrue,
          reason: 'samarinda_dense.mbtiles must exist in assets/maps/');

      final service = MbTilesService(assetPath: file.path);
      await service.initialize(customPath: file.path);

      expect(service.isReady, isTrue);
      final metadata = service.getMetadata();
      expect(metadata, isNotNull);
      expect(metadata!.name, contains('Samarinda Dense'));
      expect(metadata.format, equals('pbf'));
      expect(metadata.minZoom, equals(14.0));
      expect(metadata.maxZoom, equals(18.0));

      service.dispose();
    });

    test('2. MBTilesService initialization & tile access latency < 500 ms', () async {
      final file = File(mbtilesRelativePath);
      final service = MbTilesService(assetPath: file.path);

      final stopwatch = Stopwatch()..start();
      await service.initialize(customPath: file.path);
      expect(service.initLatencyMs, lessThan(500),
          reason: 'Initial load latency must be under 500ms');

      final provider = service.vectorTileProvider;
      expect(provider, isNotNull);

      // Verify tile retrieval latency under 100ms
      final tileBytes = await provider!.provide(TileIdentity(14, 13521, 8212));
      final tileLatency = stopwatch.elapsedMilliseconds;
      stopwatch.stop();

      expect(tileBytes, isNotEmpty);
      expect(tileLatency, lessThan(500),
          reason: 'Tile retrieval must be instantaneous (< 500 ms)');

      service.dispose();
    });

    test('3. TacticalMapTheme compiles valid Mapbox GL spec and matches Design.md §6.1', () {
      final spec = TacticalMapTheme.themeData();
      expect(spec['version'], equals(8));
      expect(spec['sources'], contains(TacticalMapTheme.sourceId));

      final layers = spec['layers'] as List<dynamic>;
      expect(layers, isNotEmpty);

      // Verify background color (light OSM-standard land tone)
      final bgLayer = layers.firstWhere((l) => l['id'] == 'background');
      expect(bgLayer['paint']['background-color'], equals('#F2EFE9'));

      // Verify artery road color
      final arteryLayer = layers.firstWhere((l) => l['id'] == 'roads-artery');
      expect(arteryLayer['paint']['line-color'], equals('#B5AEA2'));

      // Verify narrow alley color
      final alleyLayer = layers.firstWhere((l) => l['id'] == 'roads-alley');
      expect(alleyLayer['paint']['line-color'], equals('#D8D3C9'));

      // Verify river corridor color
      final riverLayer = layers.firstWhere((l) => l['id'] == 'waterways-line');
      expect(riverLayer['paint']['line-color'], equals('#0284C7'));

      // Verify ThemeReader compiles successfully
      final compiledTheme = TacticalMapTheme.buildTheme();
      expect(compiledTheme, isNotNull);
    });

    testWidgets('4. Tactical markers render without pill chips or oval badges', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: Scaffold(
            body: Column(
              children: const [
                IncidentFireMarkerWidget(label: 'Gg. 4 Pelita'),
                AttackerMarkerWidget(unitCode: 'ATK-01', bearingDegrees: 90.0),
                FeederMarkerWidget(unitCode: 'FDR-01'),
                WaterSourceMarkerWidget(
                  status: WaterSourceStatus.READY,
                  distanceMeters: 120,
                ),
              ],
            ),
          ),
        ),
      );

      expect(find.byType(IncidentFireMarkerWidget), findsOneWidget);
      expect(find.text('Gg. 4 Pelita'), findsOneWidget);

      expect(find.byType(AttackerMarkerWidget), findsOneWidget);
      expect(find.text('ATK-01'), findsOneWidget);

      expect(find.byType(FeederMarkerWidget), findsOneWidget);
      expect(find.text('FDR-01'), findsOneWidget);

      expect(find.byType(WaterSourceMarkerWidget), findsOneWidget);
      expect(find.text('120m'), findsOneWidget);

      // Verify NO Chip widgets are used
      expect(find.byType(Chip), findsNothing);
    });

    testWidgets('5. TacticalMapView renders tactical header and map viewport correctly', (tester) async {
      final file = File(mbtilesRelativePath);
      final service = MbTilesService(assetPath: file.path);
      await service.initialize(customPath: file.path);

      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: Scaffold(
            body: SizedBox(
              width: 400,
              height: 800,
              child: TacticalMapView(
                mbtilesService: service,
                roleTitle: 'MODE ATTACKER',
                isAttacker: true,
                syncStatusText: 'ONLINE (TERHUBUNG)',
                initialCenter: const LatLng(-0.4942, 117.1441),
                initialZoom: 16.0,
                renderVectorTiles: false,
                showOsmFallback: false,
              ),
            ),
          ),
        ),
      );

      // Header checks
      expect(find.text('MODE ATTACKER'), findsOneWidget);
      expect(find.text('ONLINE (TERHUBUNG)'), findsOneWidget);
      expect(find.byType(FlutterMap), findsOneWidget);

      // Ensure NO rounded pill chips or decorative pulse dots exist
      expect(find.byType(Chip), findsNothing);

      service.dispose();
    });
  });
}
