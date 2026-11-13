import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';
import 'package:mobile_volunteer/core/database/schemas/cached_water_source.dart';
import 'package:mobile_volunteer/core/network/models/enums.dart';
import 'package:mobile_volunteer/core/theme/tactical_theme.dart';
import 'package:mobile_volunteer/core/utils/geo_utils.dart';
import 'package:mobile_volunteer/features/map/services/mbtiles_service.dart';
import 'package:mobile_volunteer/features/tactical_view/screens/tactical_screen.dart';
import 'package:mobile_volunteer/features/tactical_view/widgets/attacker_action_panel.dart';
import 'package:mobile_volunteer/features/tactical_view/widgets/nearest_water_sources_panel.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TASK-404: Nearest Water Sources UI Module & Haversine Distance', () {
    test('1. GeoUtils.haversineDistance calculates accurate surface distance in meters', () {
      // Jl. Pelita Gg. 4 (-0.4942, 117.1441) ke Titik Api (-0.4942, 117.1441) = 0m
      final distSelf = GeoUtils.haversineDistance(
        lat1: -0.4942,
        lon1: 117.1441,
        lat2: -0.4942,
        lon2: 117.1441,
      );
      expect(distSelf, closeTo(0.0, 0.001));

      // Jl. Pelita Gg. 4 ke PDAM Jl. Pelita Gg. 4 (-0.4938, 117.1448) ~ 89 meter
      final distHydrant = GeoUtils.haversineDistance(
        lat1: -0.4942,
        lon1: 117.1441,
        lat2: -0.4938,
        lon2: 117.1448,
      );
      expect(distHydrant, greaterThan(70.0));
      expect(distHydrant, lessThan(110.0));
    });

    test('2. GeoUtils.findNearestWaterSources filters out DAMAGED/EMPTY and sorts top 3 nearest', () {
      final origin = const LatLng(-0.4942, 117.1441);

      final sources = [
        CachedWaterSource()
          ..serverId = 'ws-damaged'
          ..name = 'Pipa Rusak Gg. 5'
          ..sourceType = 'PDAM_HYDRANT'
          ..latitude = -0.4943 // Sangat dekat (~15m) tapi rusak!
          ..longitude = 117.1442
          ..operationalStatus = 'DAMAGED'
          ..pressureBar = 0.0,
        CachedWaterSource()
          ..serverId = 'ws-empty'
          ..name = 'Tandon Kering RT 01'
          ..sourceType = 'COMMUNITY_TOWER'
          ..latitude = -0.4944 // Sangat dekat (~25m) tapi kosong!
          ..longitude = 117.1440
          ..operationalStatus = 'EMPTY'
          ..pressureBar = 0.0,
        CachedWaterSource()
          ..serverId = 'ws-1'
          ..name = 'PDAM Jl. Pelita Gg. 4'
          ..sourceType = 'PDAM_HYDRANT'
          ..latitude = -0.4938 // ~89m
          ..longitude = 117.1448
          ..operationalStatus = 'READY'
          ..pressureBar = 4.2,
        CachedWaterSource()
          ..serverId = 'ws-2'
          ..name = 'Tandon Komunitas RT 12'
          ..sourceType = 'COMMUNITY_TOWER'
          ..latitude = -0.4946 // ~110m
          ..longitude = 117.1432
          ..operationalStatus = 'LOW_DISCHARGE'
          ..pressureBar = 2.1,
        CachedWaterSource()
          ..serverId = 'ws-3'
          ..name = 'Dermaga Pasang Surut SKM'
          ..sourceType = 'RIVER_TIDAL_DOCK'
          ..latitude = -0.4955 // ~175m
          ..longitude = 117.1450
          ..operationalStatus = 'READY'
          ..pressureBar = 3.8,
        CachedWaterSource()
          ..serverId = 'ws-4'
          ..name = 'Hidran Jauh Jl. Lambung'
          ..sourceType = 'PDAM_HYDRANT'
          ..latitude = -0.4850 // Jauh (>1 km)
          ..longitude = 117.1450
          ..operationalStatus = 'READY'
          ..pressureBar = 4.0,
      ];

      final top3 = GeoUtils.findNearestWaterSources(
        origin: origin,
        sources: sources,
        limit: 3,
        filterUsableOnly: true,
      );

      // Verifikasi DAMAGED & EMPTY terfilter keluar
      expect(top3.length, equals(3));
      expect(top3.any((item) => item.source.serverId == 'ws-damaged'), isFalse);
      expect(top3.any((item) => item.source.serverId == 'ws-empty'), isFalse);

      // Verifikasi urutan terdekat (ws-1 < ws-2 < ws-3)
      expect(top3[0].source.serverId, equals('ws-1'));
      expect(top3[1].source.serverId, equals('ws-2'));
      expect(top3[2].source.serverId, equals('ws-3'));
      expect(top3[0].distanceMeters, lessThan(top3[1].distanceMeters));
      expect(top3[1].distanceMeters, lessThan(top3[2].distanceMeters));
    });

    testWidgets('3. NearestWaterSourcesPanel renders 3 rows with glove-friendly targets >= 48 dp and NO pill chips',
        (WidgetTester tester) async {
      final items = [
        WaterSourceWithDistance(
          source: CachedWaterSource()
            ..serverId = 'ws-1'
            ..name = 'PDAM Jl. Pelita Gg. 4'
            ..sourceType = 'PDAM_HYDRANT'
            ..latitude = -0.4938
            ..longitude = 117.1448
            ..operationalStatus = 'READY'
            ..pressureBar = 4.2,
          distanceMeters: 89.2,
        ),
        WaterSourceWithDistance(
          source: CachedWaterSource()
            ..serverId = 'ws-2'
            ..name = 'Tandon Komunitas RT 12'
            ..sourceType = 'COMMUNITY_TOWER'
            ..latitude = -0.4946
            ..longitude = 117.1432
            ..operationalStatus = 'LOW_DISCHARGE'
            ..pressureBar = 2.1,
          distanceMeters: 110.5,
        ),
        WaterSourceWithDistance(
          source: CachedWaterSource()
            ..serverId = 'ws-3'
            ..name = 'Dermaga Pasang Surut SKM'
            ..sourceType = 'RIVER_TIDAL_DOCK'
            ..latitude = -0.4955
            ..longitude = 117.1450
            ..operationalStatus = 'READY'
            ..pressureBar = 3.8,
          distanceMeters: 175.0,
        ),
      ];

      CachedWaterSource? selected;

      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: Scaffold(
            body: SizedBox(
              width: 400,
              child: NearestWaterSourcesPanel(
                items: items,
                onSelectSource: (s) => selected = s,
              ),
            ),
          ),
        ),
      );

      // Verifikasi judul header dan jumlah titik siap
      expect(find.text('SUMBER AIR TERDEKAT'), findsOneWidget);
      expect(find.text('3 TITIK SIAP'), findsOneWidget);

      // Verifikasi nama titik air tertera
      expect(find.text('PDAM Jl. Pelita Gg. 4'), findsOneWidget);
      expect(find.text('Tandon Komunitas RT 12'), findsOneWidget);
      expect(find.text('Dermaga Pasang Surut SKM'), findsOneWidget);

      // Verifikasi jarak terformat
      expect(find.text('89 M'), findsOneWidget);
      expect(find.text('111 M'), findsOneWidget);
      expect(find.text('175 M'), findsOneWidget);

      // Verifikasi status operasional (READY dan DEBIT RENDAH)
      expect(find.text('READY'), findsNWidgets(2));
      expect(find.text('DEBIT RENDAH'), findsOneWidget);

      // Verifikasi target sentuh minimal 48 dp untuk setiap baris
      final rowConstraints = tester.widgetList<ConstrainedBox>(
        find.byWidgetPredicate(
          (w) => w is ConstrainedBox && w.constraints.minHeight == 48.0,
        ),
      );
      expect(rowConstraints.length, equals(3));

      // Verifikasi ketukan pada salah satu titik air
      await tester.tap(find.text('PDAM Jl. Pelita Gg. 4'));
      expect(selected?.serverId, equals('ws-1'));

      // Larangan mutlak pill chip: pastikan tidak ada widget Chip
      expect(find.byType(Chip), findsNothing);
    });

    testWidgets('4. TacticalScreen switches to SUMBER AIR (3 TERDEKAT) tab and back to role controls',
        (WidgetTester tester) async {
      final service = MbTilesService(assetPath: 'assets/maps/samarinda_dense.mbtiles');
      await service.initialize(customPath: 'assets/maps/samarinda_dense.mbtiles');

      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: SizedBox(
            width: 400,
            height: 800,
            child: TacticalScreen(
              mbtilesService: service,
              renderVectorTiles: false,
              initialRole: TacticalRole.ATTACKER,
            ),
          ),
        ),
      );
      await tester.pump();

      // Posisi awal: Panel Aksi ATTACKER aktif
      expect(find.byType(AttackerActionPanel), findsOneWidget);
      expect(find.byType(NearestWaterSourcesPanel), findsNothing);

      // Ketuk tab 'SUMBER AIR (3 TERDEKAT)'
      await tester.tap(find.text('SUMBER AIR (3 TERDEKAT)'));
      await tester.pump();

      // Panel Sumber Air aktif dan menampilkan 3 titik terdekat
      expect(find.byType(NearestWaterSourcesPanel), findsOneWidget);
      expect(find.byType(AttackerActionPanel), findsNothing);
      expect(find.text('PDAM Jl. Pelita Gg. 4'), findsOneWidget);

      // Ketuk kembali tab 'KONTROL MODE ATTACKER'
      await tester.tap(find.text('KONTROL MODE ATTACKER'));
      await tester.pump();

      // Panel Aksi ATTACKER kembali aktif
      expect(find.byType(AttackerActionPanel), findsOneWidget);
      expect(find.byType(NearestWaterSourcesPanel), findsNothing);

      service.dispose();
    });
  });
}
