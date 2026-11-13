import 'dart:ffi';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:isar/isar.dart';
import 'package:mobile_volunteer/core/database/isar_service.dart';
import 'package:mobile_volunteer/core/database/schemas/cached_water_source.dart';
import 'package:mobile_volunteer/core/database/schemas/sync_queue_item.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TASK-406: Isar Sync Queue Schema & Cached Water Sources', () {
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
      tempDir = await Directory.systemTemp.createTemp('isar_test_');
      isarService = IsarService(name: 'test_hydratact_${DateTime.now().microsecondsSinceEpoch}');
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

    test('1. SyncQueueItem: enqueue, retrieve FIFO, and mark as synced', () async {
      final now = DateTime.now().toUtc();

      final item1 = SyncQueueItem()
        ..mutationUuid = 'mut-001'
        ..endpoint = '/api/v1/water-sources/status'
        ..httpMethod = 'PATCH'
        ..payloadJson = '{"status":"READY","pressure_bar":4.5}'
        ..clientTimestamp = now.subtract(const Duration(seconds: 10))
        ..isSynced = false;

      final item2 = SyncQueueItem()
        ..mutationUuid = 'mut-002'
        ..endpoint = '/api/v1/barricades'
        ..httpMethod = 'POST'
        ..payloadJson = '{"reason":"HOSE_CONNECTED"}'
        ..clientTimestamp = now
        ..isSynced = false;

      await isarService.enqueueMutation(item1);
      await isarService.enqueueMutation(item2);

      expect(await isarService.getPendingQueueCount(), equals(2));

      // Retrieve pending mutations in FIFO order (by clientTimestamp)
      final pending = await isarService.getPendingMutations();
      expect(pending.length, equals(2));
      expect(pending[0].mutationUuid, equals('mut-001'));
      expect(pending[1].mutationUuid, equals('mut-002'));

      // Mark mut-001 as synced
      final syncedSuccess = await isarService.markMutationSynced('mut-001');
      expect(syncedSuccess, isTrue);

      expect(await isarService.getPendingQueueCount(), equals(1));
      final remaining = await isarService.getPendingMutations();
      expect(remaining.length, equals(1));
      expect(remaining.first.mutationUuid, equals('mut-002'));
    });

    test('2. SyncQueueItem: record mutation failure and increment retryCount', () async {
      final item = SyncQueueItem()
        ..mutationUuid = 'mut-err-01'
        ..endpoint = '/api/v1/sync/outbox-batch'
        ..httpMethod = 'POST'
        ..payloadJson = '{"batch":[]}'
        ..clientTimestamp = DateTime.now().toUtc()
        ..isSynced = false;

      await isarService.enqueueMutation(item);

      await isarService.recordMutationFailure('mut-err-01', 'Network timeout 504');

      final pending = await isarService.getPendingMutations();
      expect(pending.first.retryCount, equals(1));
      expect(pending.first.lastErrorMessage, equals('Network timeout 504'));
    });

    test('3. CachedWaterSource: cache, query by serverId, and optimistic status update', () async {
      final now = DateTime.now().toUtc();

      final source1 = CachedWaterSource()
        ..serverId = 'ws-pelita-01'
        ..name = 'Hidran PDAM Gg. 4 Pelita'
        ..sourceType = 'PDAM_HYDRANT'
        ..latitude = -0.4948
        ..longitude = 117.1450
        ..operationalStatus = 'READY'
        ..pressureBar = 4.2
        ..updatedAt = now;

      final source2 = CachedWaterSource()
        ..serverId = 'ws-tandon-02'
        ..name = 'Tandon Warga RT 12'
        ..sourceType = 'COMMUNITY_TOWER'
        ..latitude = -0.4955
        ..longitude = 117.1435
        ..operationalStatus = 'LOW_DISCHARGE'
        ..pressureBar = 1.8
        ..updatedAt = now;

      await isarService.cacheWaterSources([source1, source2]);

      final allSources = await isarService.getAllCachedWaterSources();
      expect(allSources.length, equals(2));

      final queried = await isarService.getWaterSourceByServerId('ws-pelita-01');
      expect(queried, isNotNull);
      expect(queried!.name, equals('Hidran PDAM Gg. 4 Pelita'));
      expect(queried.operationalStatus, equals('READY'));

      // Optimistic update: mark as EMPTY (debit habis)
      final updateSuccess = await isarService.updateCachedWaterSourceStatus(
        'ws-pelita-01',
        'EMPTY',
        pressureBar: 0.0,
      );
      expect(updateSuccess, isTrue);

      final updated = await isarService.getWaterSourceByServerId('ws-pelita-01');
      expect(updated!.operationalStatus, equals('EMPTY'));
      expect(updated.pressureBar, equals(0.0));
    });
  });
}
