import 'dart:ffi';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:isar/isar.dart';
import 'package:mobile_volunteer/core/database/isar_service.dart';
import 'package:mobile_volunteer/core/database/schemas/cached_water_source.dart';
import 'package:mobile_volunteer/core/network/api_client.dart';
import 'package:mobile_volunteer/core/network/models/enums.dart';
import 'package:mobile_volunteer/core/sync/optimistic_mutation_service.dart';
import 'package:mobile_volunteer/core/sync/outbox_worker.dart';
import 'package:mobile_volunteer/core/theme/tactical_theme.dart';
import 'package:mobile_volunteer/core/utils/geo_utils.dart';
import 'package:mobile_volunteer/features/map/services/mbtiles_service.dart';
import 'package:mobile_volunteer/features/tactical_view/screens/tactical_screen.dart';
import 'package:mobile_volunteer/features/tactical_view/widgets/feeder_action_panel.dart';
import 'package:mobile_volunteer/features/tactical_view/widgets/nearest_water_sources_panel.dart';
import 'package:mobile_volunteer/features/tactical_view/widgets/water_status_action_sheet.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TASK-405: 1-Tap Water Status & Hose Barricade Switch Actions (>= 48 dp)', () {
    late Directory tempDir;
    late IsarService isarService;

    setUpAll(() async {
      final isarDll = File('isar.dll');
      if (isarDll.existsSync()) {
        await Isar.initializeIsarCore(libraries: {
          Abi.windowsX64: isarDll.absolute.path,
        });
      } else {
        await Isar.initializeIsarCore();
      }
    });

    setUp(() async {
      tempDir = await Directory.systemTemp.createTemp('isar_task405_');
      isarService = IsarService(name: 'task405_${DateTime.now().microsecondsSinceEpoch}');
      await isarService.open(directory: tempDir.path);
    });

    tearDown(() async {
      await isarService.close();
      if (tempDir.existsSync()) {
        try {
          tempDir.deleteSync(recursive: true);
        } catch (_) {}
      }
    });

    testWidgets('1. WaterStatus1TapBar renders 3 buttons with 52 dp height and triggers callback',
        (WidgetTester tester) async {
      final source = CachedWaterSource()
        ..serverId = 'ws-test-01'
        ..name = 'PDAM Jl. Pelita Gg. 4'
        ..sourceType = 'PDAM_HYDRANT'
        ..operationalStatus = 'READY'
        ..pressureBar = 4.2
        ..latitude = -0.4938
        ..longitude = 117.1448
        ..updatedAt = DateTime.now().toUtc();

      String? selectedStatus;

      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: Scaffold(
            body: SizedBox(
              width: 400,
              child: WaterStatus1TapBar(
                source: source,
                onSelectStatus: (st) => selectedStatus = st,
              ),
            ),
          ),
        ),
      );

      // Verifikasi 3 tombol status air tertera
      expect(find.text('READY'), findsOneWidget);
      expect(find.text('DEBIT RENDAH'), findsOneWidget);
      expect(find.text('KERING'), findsOneWidget);

      // Verifikasi tinggi target sentuh tepat 52 dp (>= 48 dp)
      final buttonBoxes = tester.widgetList<SizedBox>(
        find.byWidgetPredicate((w) => w is SizedBox && w.height == 52.0),
      );
      expect(buttonBoxes.length, equals(3));

      // Verifikasi tidak ada widget Chip
      expect(find.byType(Chip), findsNothing);

      // Ketuk [ DEBIT RENDAH ]
      await tester.tap(find.text('DEBIT RENDAH'));
      expect(selectedStatus, equals('LOW_DISCHARGE'));

      // Ketuk [ KERING ]
      await tester.tap(find.text('KERING'));
      expect(selectedStatus, equals('EMPTY'));
    });

    testWidgets('2. NearestWaterSourcesPanel expands 1-tap bar on row tap and triggers status update',
        (WidgetTester tester) async {
      final testSource = CachedWaterSource()
        ..serverId = 'ws-01'
        ..name = 'PDAM Jl. Pelita Gg. 4'
        ..sourceType = 'PDAM_HYDRANT'
        ..operationalStatus = 'READY'
        ..pressureBar = 4.2
        ..latitude = -0.4938
        ..longitude = 117.1448
        ..updatedAt = DateTime.now().toUtc();

      final items = [
        WaterSourceWithDistance(source: testSource, distanceMeters: 85.0),
      ];

      String? updatedStatus;

      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: Scaffold(
            body: SizedBox(
              width: 400,
              child: NearestWaterSourcesPanel(
                items: items,
                onUpdateStatus: (src, newStatus) {
                  updatedStatus = newStatus;
                },
              ),
            ),
          ),
        ),
      );

      // Awalnya WaterStatus1TapBar belum muncul
      expect(find.byType(WaterStatus1TapBar), findsNothing);

      // Ketuk baris titik air
      await tester.tap(find.text('PDAM Jl. Pelita Gg. 4'));
      await tester.pump();

      // WaterStatus1TapBar kini muncul
      expect(find.byType(WaterStatus1TapBar), findsOneWidget);

      // Ketuk [ DEBIT RENDAH ]
      await tester.tap(find.text('DEBIT RENDAH'));
      expect(updatedStatus, equals('LOW_DISCHARGE'));
    });

    testWidgets('3. FeederActionPanel renders glove-friendly barricade switch (64 dp) and toggles active',
        (WidgetTester tester) async {
      bool barricadeActive = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SizedBox(
                  width: 400,
                  height: 300,
                  child: FeederActionPanel(
                    isBarricadeActive: barricadeActive,
                    onToggleBarricade: () {
                      setState(() {
                        barricadeActive = !barricadeActive;
                      });
                    },
                    unitCode: 'FDR-01',
                  ),
                );
              },
            ),
          ),
        ),
      );

      // Verifikasi tinggi sakelar 64 dp (>= 48 dp)
      final switchSizedBox = tester.widget<SizedBox>(
        find.byWidgetPredicate((w) => w is SizedBox && w.height == 64.0).first,
      );
      expect(switchSizedBox.height, equals(64.0));

      // Verifikasi teks awal
      expect(find.text('AKTIFKAN BARIKADE SELANG'), findsOneWidget);

      // Ketuk sakelar barikade
      await tester.tap(find.text('AKTIFKAN BARIKADE SELANG'));
      await tester.pump();

      // Status berubah aktif
      expect(barricadeActive, isTrue);
      expect(find.text('BARIKADE AKTIF: SELANG TERBENTANG'), findsOneWidget);
    });

    testWidgets('4. TacticalScreen triggers OptimisticMutationService on barricade & water status tap',
        (WidgetTester tester) async {
      await tester.runAsync(() async {
        final apiClient = HydraTactApiClient();
        final outboxWorker = OutboxWorker(
          isarService: isarService,
          apiClient: apiClient,
          initialOnline: false, // Simulasi sedang offline
        );
        await outboxWorker.refreshStatus();

        final optimisticService = OptimisticMutationService(
          isarService: isarService,
          outboxWorker: outboxWorker,
        );

        final mbtilesService = MbTilesService(assetPath: 'assets/maps/samarinda_dense.mbtiles');
        await mbtilesService.initialize(customPath: 'assets/maps/samarinda_dense.mbtiles');

        await tester.pumpWidget(
          MaterialApp(
            theme: TacticalTheme.darkTheme,
            home: SizedBox(
              width: 400,
              height: 800,
              child: TacticalScreen(
                mbtilesService: mbtilesService,
                outboxWorker: outboxWorker,
                optimisticMutationService: optimisticService,
                initialRole: TacticalRole.FEEDER,
                renderVectorTiles: false,
              ),
            ),
          ),
        );
        await tester.pump();

        // 1. Ketuk Sakelar Barikade di FEEDER Action Panel
        await tester.tap(find.text('AKTIFKAN BARIKADE SELANG'));
        await Future.delayed(const Duration(milliseconds: 100));
        await tester.pump();

        // Verifikasi mutasi barikade masuk ke Isar outbox
        final pendingAfterBarricade = await isarService.getPendingMutations();
        expect(pendingAfterBarricade.length, equals(1));
        expect(pendingAfterBarricade.first.endpoint, equals('/api/v1/barricades'));

        // 2. Beralih ke tab SUMBER AIR (3 TERDEKAT)
        await tester.tap(find.text('SUMBER AIR (3 TERDEKAT)'));
        await Future.delayed(const Duration(milliseconds: 100));
        await tester.pump();

        // Titik terdekat otomatis terbuka dengan WaterStatus1TapBar (1-tap ready)
        expect(find.byType(WaterStatus1TapBar), findsOneWidget);

        // Ketuk tombol [ DEBIT RENDAH ] di dalam WaterStatus1TapBar
        final debitRendahButton = find.descendant(
          of: find.byType(WaterStatus1TapBar),
          matching: find.text('DEBIT RENDAH'),
        );
        await tester.tap(debitRendahButton);
        await Future.delayed(const Duration(milliseconds: 100));
        await tester.pump();

        // Verifikasi mutasi status air masuk ke Isar outbox
        final pendingAfterWater = await isarService.getPendingMutations();
        expect(pendingAfterWater.length, equals(2));
        expect(pendingAfterWater.last.endpoint, contains('/status'));

        mbtilesService.dispose();
      });
    });
  });
}
