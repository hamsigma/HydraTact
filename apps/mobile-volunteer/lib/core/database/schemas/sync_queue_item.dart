import 'package:isar/isar.dart';

part 'sync_queue_item.g.dart';

/// Skema Antrean Mutasi Luring (Outbox Pattern)
/// Sesuai docs/Database.md Bagian 4 & Architecture.md
@collection
class SyncQueueItem {
  Id localId = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String mutationUuid;

  late String endpoint; // Contoh: '/api/v1/sync/outbox-batch' atau '/api/v1/water-sources/status'
  late String httpMethod; // 'POST' atau 'PATCH'
  late String payloadJson; // Serialisasi JSON muatan mutasi
  late DateTime clientTimestamp;

  @Index()
  bool isSynced = false;

  int retryCount = 0;
  String? lastErrorMessage;
}
