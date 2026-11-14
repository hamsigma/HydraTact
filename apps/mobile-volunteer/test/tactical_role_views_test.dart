import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_volunteer/core/network/models/enums.dart';
import 'package:mobile_volunteer/core/theme/tactical_theme.dart';
import 'package:mobile_volunteer/features/map/services/mbtiles_service.dart';
import 'package:mobile_volunteer/features/tactical_view/screens/tactical_screen.dart';
import 'package:mobile_volunteer/features/tactical_view/widgets/attacker_action_panel.dart';
import 'package:mobile_volunteer/features/tactical_view/widgets/feeder_action_panel.dart';

void main() {
  group('TASK-403: Mobile Tactical Role Views (ATTACKER vs FEEDER)', () {
    testWidgets('1. AttackerActionPanel renders 64 dp pressure button and toggles state', (tester) async {
      bool pressureRequested = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: TacticalTheme.darkTheme,
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SizedBox(
                  width: 400,
                  height: 300,
                  child: AttackerActionPanel(
                    isPressureRequested: pressureRequested,
                    onTogglePressure: () {
                      setState(() {
                        pressureRequested = !pressureRequested;
                      });
                    },
                    unitCode: 'ATK-01',
                    targetPressureBar: 5.0,
                    nozzleDischargeLpm: 320,
                    distanceToFireMeters: 35,
                  ),
                );
              },
            ),
          ),
        ),
      );

      // Verify touch target height is 64 dp
      final buttonSizedBox = tester.widget<SizedBox>(
        find.byWidgetPredicate(
          (w) => w is SizedBox && w.height == 64.0,
        ).first,
      );
      expect(buttonSizedBox.height, equals(64.0));

      // Initial state: Standby pressure request
      expect(find.text('MINTA TEKANAN POMPA (5.0 BAR)'), findsOneWidget);
      expect(find.text('JARAK KE API'), findsOneWidget);
      expect(find.text('35 M'), findsOneWidget);
      expect(find.text('DEBIT NOZEL'), findsOneWidget);
      expect(find.text('320 LPM'), findsOneWidget);

      // Tap the critical action button
      await tester.tap(find.text('MINTA TEKANAN POMPA (5.0 BAR)'));
      await tester.pump();

      // State toggled
      expect(pressureRequested, isTrue);
      expect(find.text('TEKANAN DIMINTA: 5.0 BAR'), findsOneWidget);

      // Verify strict ban on pill chips
      expect(find.byType(Chip), findsNothing);
    });

    testWidgets('2. FeederActionPanel renders 64 dp barricade switch and parking info', (tester) async {
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
                    arteryRoadName: 'JL. PELITA UTAMA',
                    remainingWaterLiters: 4200,
                  ),
                );
              },
            ),
          ),
        ),
      );

      // Verify touch target height is 64 dp
      final barricadeSizedBox = tester.widget<SizedBox>(
        find.byWidgetPredicate(
          (w) => w is SizedBox && w.height == 64.0,
        ).first,
      );
      expect(barricadeSizedBox.height, equals(64.0));

      // Initial state: Barricade inactive
      expect(find.text('AKTIFKAN BARIKADE SELANG'), findsOneWidget);
      expect(find.text('PARKIR ARTERI (>= 6M)'), findsOneWidget);
      expect(find.text('JL. PELITA UTAMA'), findsOneWidget);
      expect(find.text('SISA AIR TANGKI'), findsOneWidget);
      expect(find.text('4200 L'), findsOneWidget);

      // Tap barricade toggle
      await tester.tap(find.text('AKTIFKAN BARIKADE SELANG'));
      await tester.pump();

      // State toggled
      expect(barricadeActive, isTrue);
      expect(find.text('BARIKADE AKTIF: SELANG TERBENTANG'), findsOneWidget);

      // Verify strict ban on pill chips
      expect(find.byType(Chip), findsNothing);
    });

    testWidgets('3. TacticalScreen dynamically switches between ATTACKER and FEEDER modes', (tester) async {
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
              initialRole: TacticalRole.ATTACKER,
              renderVectorTiles: false,
            ),
          ),
        ),
      );

      // Initial role: ATTACKER
      expect(find.text('MODE ATTACKER'), findsOneWidget);
      expect(find.byType(AttackerActionPanel), findsOneWidget);
      expect(find.byType(FeederActionPanel), findsNothing);

      // Switch to FEEDER role
      await tester.tap(find.textContaining('KETUK UNTUK GANTI PERAN'));
      await tester.pump();

      // Active role: FEEDER
      expect(find.text('MODE FEEDER'), findsOneWidget);
      expect(find.byType(FeederActionPanel), findsOneWidget);
      expect(find.byType(AttackerActionPanel), findsNothing);

      // Verify strictly no pill chips anywhere
      expect(find.byType(Chip), findsNothing);

      service.dispose();
    });
  });
}
