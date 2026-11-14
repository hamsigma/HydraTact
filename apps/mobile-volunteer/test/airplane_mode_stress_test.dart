import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:isar/isar.dart';
import 'package:mobile_volunteer/core/database/isar_service.dart';
import 'package:mobile_volunteer/core/database/schemas/cached_water_source.dart';
import 'package:mobile_volunteer/core/network/api_client.dart';
import 'package:mobile_volunteer/core/sync/optimistic_mutation_service.dart';
import 'package:mobile_volunteer/core/sync/outbox_worker.dart';

/// Fake HTTP Client untuk menangkap batch request sinkronisasi saat sinyal pulih
class StressTestFakeHttpClient extends http.BaseClient {
  final List<http.BaseRequest> capturedRequests = [];
  final List<String> capturedBodies = [];

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    capturedRequests.add(request);

    if (request is http.Request) {
      capturedBodies.add(request.body);
    }

    // Default mock response: sukses batch sync untuk seluruh item
    final defaultResponseJson = jsonEncode({
      'status': 'success',
      'data': {
        'batch_id': 'stress-batch-${DateTime.now().millisecondsSinceEpoch}',
        'processed_count': 10,
        'success_count': 10,
        'failed_count': 0,
        'results': List.generate(
          10,
          (i) => {
            'mutation_uuid': 'mut-$i',
            'sync_status': 'APPLIED',
            'reason': null,
          },
        ),
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

  group('TASK-502: Airplane Mode Stress Test (10 Offline Mutations & Cold App Restart)', () {
    late Directory persistentDir;
    late StressTestFakeHttpClient fakeHttpClient;
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
      persistentDir = await Directory.systemTemp.createTemp('persistent_airplane_mode_');
      fakeHttpClient = StressTestFakeHttpClient();
      apiClient = HydraTactApiClient(
        baseUrl: 'http://localhost:8000/api/v1',
        client: fakeHttpClient,
      );
    });

    tearDown(() async {
      if (persistentDir.existsSync()) {
        try {
          persistentDir.deleteSync(recursive: true);
        } catch (_) {}
      }
    });

    test('Full Lifecycle: 10 Offline Mutations -> Process Kill / Cold Restart -> Queue Persistence -> Online Drain',
        () async {
      const dbName = 'hydratact_stress_test';

      // =======================================================================
      // FASE 1: Aplikasi berjalan dalam Airplane Mode (Konektivitas Mati / Offline)
      // =======================================================================
      final isarServiceSession1 = IsarService(name: dbName);
      await isarServiceSession1.open(directory: persistentDir.path);

      // Siapkan sumber air awal
      final initialSource = CachedWaterSource()
        ..serverId = 'ws-pelita-pdam'
        ..name = 'PDAM Jl. Pelita Gg. 4'
        ..sourceType = 'PDAM_HYDRANT'
        ..operationalStatus = 'READY'
        ..pressureBar = 4.5
        ..latitude = -0.4938
        ..longitude = 117.1448
        ..updatedAt = DateTime.now().toUtc();
      await isarServiceSession1.cacheWaterSources([initialSource]);

      final outboxWorkerSession1 = OutboxWorker(
        isarService: isarServiceSession1,
        apiClient: apiClient,
        initialOnline: false, // AIRPLANE MODE AKTIF!
      );
      await outboxWorkerSession1.refreshStatus();

      final optimisticServiceSession1 = OptimisticMutationService(
        isarService: isarServiceSession1,
        outboxWorker: outboxWorkerSession1,
      );

      // Verifikasi status awal
      expect(outboxWorkerSession1.statusNotifier.value.isOnline, isFalse);
      expect(outboxWorkerSession1.statusNotifier.value.pendingCount, equals(0));

      // =======================================================================
      // FASE 2: Eksekusi 10 Mutasi Luring Berturut-Turut (Zero Network Traffic)
      // =======================================================================
      // Mutasi 1-4: Update status hidran
      await optimisticServiceSession1.updateWaterSourceStatusOptimistic(
        serverId: 'ws-pelita-pdam',
        newStatus: 'LOW_DISCHARGE',
        pressureBar: 2.2,
      );
      await optimisticServiceSession1.updateWaterSourceStatusOptimistic(
        serverId: 'ws-pelita-pdam',
        newStatus: 'EMPTY',
        pressureBar: 0.0,
      );
      await optimisticServiceSession1.updateWaterSourceStatusOptimistic(
        serverId: 'ws-pelita-pdam',
        newStatus: 'READY',
        pressureBar: 4.8,
      );
      await optimisticServiceSession1.updateWaterSourceStatusOptimistic(
        serverId: 'ws-pelita-pdam',
        newStatus: 'LOW_DISCHARGE',
        pressureBar: 1.9,
      );

      // Mutasi 5-7: Sakelar Barikade Selang
      await optimisticServiceSession1.toggleBarricadeOptimistic(
        barricadeId: 'barr-pelita-01',
        activate: true,
      );
      await optimisticServiceSession1.toggleBarricadeOptimistic(
        barricadeId: 'barr-pelita-01',
        activate: false,
      );
      await optimisticServiceSession1.toggleBarricadeOptimistic(
        barricadeId: 'barr-pelita-01',
        activate: true,
      );

      // Mutasi 8-10: Permintaan Tekanan Pompa Attacker
      await optimisticServiceSession1.requestWaterPressureOptimistic(
        unitId: 'ATK-01',
        targetPressureBar: 4.0,
      );
      await optimisticServiceSession1.requestWaterPressureOptimistic(
        unitId: 'ATK-01',
        targetPressureBar: 5.5,
      );
      await optimisticServiceSession1.requestWaterPressureOptimistic(
        unitId: 'ATK-01',
        targetPressureBar: 6.0,
      );

      // Verifikasi: Seluruh 10 mutasi tersimpan di Isar DB lokal
      final pendingCountBeforeKill = await isarServiceSession1.getPendingQueueCount();
      expect(pendingCountBeforeKill, equals(10));

      // Verifikasi: Zero HTTP traffic saat offline
      expect(fakeHttpClient.capturedRequests.length, equals(0));

      // Verifikasi status UI taktis
      expect(
        outboxWorkerSession1.statusNotifier.value.tacticalStatusText,
        equals('OFFLINE (10 ANTREAN)'),
      );

      // =======================================================================
      // FASE 3: Simulasi Kill / Crash / Cold Restart Aplikasi Android
      // =======================================================================
      // Tutup paksa IsarService dan matikan worker sesi 1
      outboxWorkerSession1.dispose();
      await isarServiceSession1.close();

      // =======================================================================
      // FASE 4: Sesi 2 - Inisialisasi Ulang Aplikasi (Re-Open Database di Disk)
      // =======================================================================
      final isarServiceSession2 = IsarService(name: dbName);
      await isarServiceSession2.open(directory: persistentDir.path);

      // Verifikasi Keutuhan Data (Zero Data Loss):
      // Ke-10 mutasi harus tetap ada di antrean lokal setelah aplikasi restart!
      final pendingCountAfterRestart = await isarServiceSession2.getPendingQueueCount();
      expect(
        pendingCountAfterRestart,
        equals(10),
        reason: 'Seluruh 10 mutasi luring harus tetap utuh di disk setelah cold restart',
      );

      final outboxWorkerSession2 = OutboxWorker(
        isarService: isarServiceSession2,
        apiClient: apiClient,
        initialOnline: false, // Masih offline saat baru booting
      );
      await outboxWorkerSession2.refreshStatus();

      expect(
        outboxWorkerSession2.statusNotifier.value.tacticalStatusText,
        equals('OFFLINE (10 ANTREAN)'),
      );

      // =======================================================================
      // FASE 5: Sinyal 4G Pulih! (Konektivitas Aktif Kembali)
      // =======================================================================
      await outboxWorkerSession2.setConnectivity(true);

      // Verifikasi: Tepat 1 batch request dikirim ke backend
      expect(fakeHttpClient.capturedRequests.length, equals(1));
      final batchRequest = fakeHttpClient.capturedRequests.first;
      expect(batchRequest.url.path, equals('/api/v1/sync/outbox-batch'));

      final bodyJson = jsonDecode(fakeHttpClient.capturedBodies.first) as Map<String, dynamic>;
      final List mutations = bodyJson['mutations'] as List;

      // Verifikasi: Tepat 10 mutasi terkirim tanpa duplikasi
      expect(mutations.length, equals(10));

      // Verifikasi keunikan UUID (No Duplication)
      final Set<String> uuidSet = {};
      for (final m in mutations) {
        final uuid = m['mutation_uuid'] as String;
        expect(uuidSet.contains(uuid), isFalse, reason: 'Tidak boleh ada mutation_uuid yang duplikat');
        uuidSet.add(uuid);
      }
      expect(uuidSet.length, equals(10));

      // Verifikasi urutan FIFO: client_timestamp harus monoton meningkat atau sama
      for (int i = 0; i < mutations.length - 1; i++) {
        final t1 = DateTime.parse(mutations[i]['client_timestamp'] as String);
        final t2 = DateTime.parse(mutations[i + 1]['client_timestamp'] as String);
        expect(
          t1.isBefore(t2) || t1.isAtSameMomentAs(t2),
          isTrue,
          reason: 'Antrean harus terkirim secara FIFO deterministik',
        );
      }

      // Verifikasi: Seluruh antrean Isar kini bersih (0 pending)
      final pendingCountAfterSync = await isarServiceSession2.getPendingQueueCount();
      expect(pendingCountAfterSync, equals(0));

      // Verifikasi status UI beralih ke ONLINE (TERHUBUNG)
      expect(
        outboxWorkerSession2.statusNotifier.value.tacticalStatusText,
        equals('ONLINE (TERHUBUNG)'),
      );

      // Bersihkan sesi 2
      outboxWorkerSession2.dispose();
      await isarServiceSession2.close();
    });
  });
}
