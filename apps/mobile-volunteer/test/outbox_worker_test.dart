import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:isar/isar.dart';
import 'package:mobile_volunteer/core/database/isar_service.dart';
import 'package:mobile_volunteer/core/database/schemas/cached_water_source.dart';
import 'package:mobile_volunteer/core/network/api_client.dart';
import 'package:mobile_volunteer/core/network/models/enums.dart';
import 'package:mobile_volunteer/core/sync/optimistic_mutation_service.dart';
import 'package:mobile_volunteer/core/sync/outbox_worker.dart';
import 'package:mobile_volunteer/features/map/services/mbtiles_service.dart';
import 'package:mobile_volunteer/features/tactical_view/screens/tactical_screen.dart';

/// Mock HTTP Client untuk menguji pengiriman batch outbox
class FakeOutboxHttpClient extends http.BaseClient {
  FakeOutboxHttpClient({this.handler});

  Future<http.Response> Function(http.BaseRequest request)? handler;
  final List<http.BaseRequest> capturedRequests = [];
  final List<String> capturedBodies = [];

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    capturedRequests.add(request);

    if (request is http.Request) {
      capturedBodies.add(request.body);
    }

    if (handler != null) {
      final response = await handler!(request);
      return http.StreamedResponse(
        Stream.value(utf8.encode(response.body)),
        response.statusCode,
        headers: response.headers,
      );
    }

    // Default mock response: sukses batch sync sesuai kontrak FastAPI OutboxBatchResponse
    final defaultResponseJson = jsonEncode({
      'status': 'success',
      'data': {
        'batch_id': 'batch-${DateTime.now().millisecondsSinceEpoch}',
        'processed_count': 1,
        'success_count': 1,
        'failed_count': 0,
        'results': [
          {
            'mutation_uuid': 'dummy-uuid',
            'sync_status': 'APPLIED',
            'reason': null,
          }
        ],
      },
    });

    return http.StreamedResponse(
      Stream.value(utf8.encode(defaultResponseJson)),
      200,
      headers: {'content-type': 'application/json'},
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TASK-407: Outbox Worker & Optimistic Offline Mutation Service', () {
    late Directory tempDir;
    late IsarService isarService;
    late FakeOutboxHttpClient fakeHttpClient;
    late HydraTactApiClient apiClient;

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
      tempDir = await Directory.systemTemp.createTemp('isar_outbox_test_');
      isarService = IsarService(name: 'outbox_test_${DateTime.now().microsecondsSinceEpoch}');
      await isarService.open(directory: tempDir.path);

      fakeHttpClient = FakeOutboxHttpClient();
      apiClient = HydraTactApiClient(
        baseUrl: 'http://localhost:8000/api/v1',
        client: fakeHttpClient,
      );
    });

    tearDown(() async {
      await isarService.close();
      if (tempDir.existsSync()) {
        try {
          tempDir.deleteSync(recursive: true);
        } catch (_) {}
      }
    });

    test('1. Optimistic Mutation Service updates local Isar DB in < 100 ms and queues mutation', () async {
      // Siapkan data awal hidran di cache lokal
      final waterSource = CachedWaterSource()
        ..serverId = 'ws-pelita-01'
        ..name = 'Hidran Jl. Pelita Gg. 4'
        ..sourceType = 'PDAM_HYDRANT'
        ..operationalStatus = 'READY'
        ..pressureBar = 4.2
        ..latitude = -0.4940
        ..longitude = 117.1440
        ..updatedAt = DateTime.now().toUtc();
      await isarService.cacheWaterSources([waterSource]);

      final outboxWorker = OutboxWorker(
        isarService: isarService,
        apiClient: apiClient,
        initialOnline: false, // Simulasi sedang luring / airplane mode
      );
      await outboxWorker.refreshStatus();

      final optimisticService = OptimisticMutationService(
        isarService: isarService,
        outboxWorker: outboxWorker,
      );

      final stopwatch = Stopwatch()..start();
      await optimisticService.updateWaterSourceStatusOptimistic(
        serverId: 'ws-pelita-01',
        newStatus: 'LOW_DISCHARGE',
        pressureBar: 1.8,
        reason: 'Debit mengecil drastis akibat pipa pecah',
      );
      stopwatch.stop();

      // Verifikasi latensi mutasi lokal seketika (< 100 ms)
      expect(stopwatch.elapsedMilliseconds, lessThan(100));

      // Verifikasi cache lokal langsung terbarukan secara optimistik
      final updatedLocal = await isarService.getWaterSourceByServerId('ws-pelita-01');
      expect(updatedLocal, isNotNull);
      expect(updatedLocal!.operationalStatus, equals('LOW_DISCHARGE'));
      expect(updatedLocal.pressureBar, equals(1.8));

      // Verifikasi item mutasi masuk ke antrean Isar DB
      final pendingCount = await isarService.getPendingQueueCount();
      expect(pendingCount, equals(1));

      final pendingItems = await isarService.getPendingMutations();
      expect(pendingItems.first.endpoint, equals('/api/v1/water-sources/ws-pelita-01/status'));
      expect(pendingItems.first.httpMethod, equals('PATCH'));
      expect(pendingItems.first.isSynced, isFalse);

      // Verifikasi status outbox UI melaporkan offline dengan 1 antrean
      expect(outboxWorker.statusNotifier.value.isOnline, isFalse);
      expect(outboxWorker.statusNotifier.value.pendingCount, equals(1));
      expect(outboxWorker.statusNotifier.value.tacticalStatusText, equals('OFFLINE (1 ANTREAN)'));
    });

    test('2. Multiple mutations queue up offline and flush via FIFO when connectivity recovers', () async {
      final outboxWorker = OutboxWorker(
        isarService: isarService,
        apiClient: apiClient,
        initialOnline: false, // Mulai dalam keadaan offline
      );
      await outboxWorker.refreshStatus();

      final optimisticService = OptimisticMutationService(
        isarService: isarService,
        outboxWorker: outboxWorker,
      );

      // Enqueue 2 mutasi berturut-turut saat offline
      await optimisticService.toggleBarricadeOptimistic(
        barricadeId: 'barr-01',
        activate: true,
        unitId: 'FDR-01',
      );
      await optimisticService.requestWaterPressureOptimistic(
        unitId: 'ATK-01',
        targetPressureBar: 6.0,
      );

      // Verifikasi antrean di Isar ada 2 dan HTTP belum dipanggil
      expect(await isarService.getPendingQueueCount(), equals(2));
      expect(fakeHttpClient.capturedRequests.length, equals(0));
      expect(outboxWorker.statusNotifier.value.tacticalStatusText, equals('OFFLINE (2 ANTREAN)'));

      // Sinyal 4G/LTE pulih kembali!
      await outboxWorker.setConnectivity(true);

      // Verifikasi panggilan API batch telah dikirim ke backend
      expect(fakeHttpClient.capturedRequests.length, equals(1));
      final sentRequest = fakeHttpClient.capturedRequests.first;
      expect(sentRequest.url.path, equals('/api/v1/sync/outbox-batch'));
      expect(sentRequest.method, equals('POST'));

      final bodyJson = jsonDecode(fakeHttpClient.capturedBodies.first) as Map<String, dynamic>;
      expect(bodyJson['device_id'], equals('dev-android-01'));
      final List mutations = bodyJson['mutations'] as List;
      expect(mutations.length, equals(2));
      expect(mutations[0]['target_id'], equals('barr-01'));
      expect(mutations[1]['target_id'], equals('ATK-01'));

      // Verifikasi status antrean di Isar telah dikosongkan (semua isSynced = true)
      final remainingPending = await isarService.getPendingQueueCount();
      expect(remainingPending, equals(0));
      expect(outboxWorker.statusNotifier.value.tacticalStatusText, equals('ONLINE (TERHUBUNG)'));
    });

    test('3. Network failure during flush retains queue and increments retry count', () async {
      // Mock kegagalan jaringan (500 Server Error)
      fakeHttpClient.handler = (request) async {
        return http.Response(
          jsonEncode({'detail': 'Internal Server Error'}),
          500,
          headers: {'content-type': 'application/json'},
        );
      };

      final outboxWorker = OutboxWorker(
        isarService: isarService,
        apiClient: apiClient,
        initialOnline: false,
      );
      await outboxWorker.refreshStatus();

      // Enqueue 1 mutasi
      await outboxWorker.enqueue(
        endpoint: '/api/v1/units/ATK-01/pressure-request',
        httpMethod: 'POST',
        payload: {'pressure': 4.5},
      );

      // Coba flush saat online
      final flushResult = await outboxWorker.flushQueue();
      // Saat isOnline false, flushQueue mengabaikan
      expect(flushResult.processedCount, equals(0));

      // Ubah konektivitas jadi online -> memicu flush dan mengalami 500 error
      await outboxWorker.setConnectivity(true);

      // Antrean tidak boleh hilang (Zero Data Loss)
      final pendingCount = await isarService.getPendingQueueCount();
      expect(pendingCount, equals(1));

      final items = await isarService.getPendingMutations();
      expect(items.first.isSynced, isFalse);
      expect(items.first.retryCount, greaterThanOrEqualTo(1));
    });

    testWidgets('4. TacticalScreen reflects OutboxWorker status dynamically in tactical header',
        (WidgetTester tester) async {
      await tester.runAsync(() async {
        final outboxWorker = OutboxWorker(
          isarService: isarService,
          apiClient: apiClient,
          initialOnline: false, // Mulai OFFLINE
        );
        await outboxWorker.refreshStatus();

        final optimisticService = OptimisticMutationService(
          isarService: isarService,
          outboxWorker: outboxWorker,
        );

        // Enqueue 1 mutasi agar statusnya OFFLINE (1 ANTREAN)
        await optimisticService.toggleBarricadeOptimistic(
          barricadeId: 'barr-02',
          activate: true,
        );

        final mbtilesService = MbTilesService(assetPath: 'assets/maps/samarinda_dense.mbtiles');
        await mbtilesService.initialize(customPath: 'assets/maps/samarinda_dense.mbtiles');

        await tester.pumpWidget(
          MaterialApp(
            home: SizedBox(
              width: 400,
              height: 800,
              child: TacticalScreen(
                mbtilesService: mbtilesService,
                outboxWorker: outboxWorker,
                optimisticMutationService: optimisticService,
                renderVectorTiles: false,
                initialRole: TacticalRole.ATTACKER,
              ),
            ),
          ),
        );
        await tester.pump();

        // Verifikasi Tactical Header menampilkan teks OFFLINE (1 ANTREAN)
        expect(find.text('OFFLINE (1 ANTREAN)'), findsOneWidget);

        // Pulihkan konektivitas secara dinamis
        await outboxWorker.setConnectivity(true);
        await tester.pump();

        // Verifikasi Tactical Header otomatis berubah ke ONLINE (TERHUBUNG)
        expect(find.text('ONLINE (TERHUBUNG)'), findsOneWidget);

        mbtilesService.dispose();
      });
    });
  });
}
