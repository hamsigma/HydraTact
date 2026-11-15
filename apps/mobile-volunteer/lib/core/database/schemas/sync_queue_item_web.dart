/// Varian web untuk [SyncQueueItem] — bentuk field identik dengan versi Isar.
/// Di web, antrean disimpan sementara di memori oleh IsarService varian web.
class SyncQueueItem {
  int localId = 0;

  late String mutationUuid;

  late String endpoint; // Contoh: '/api/v1/sync/outbox-batch' atau '/api/v1/water-sources/status'
  late String httpMethod; // 'POST' atau 'PATCH'
  late String payloadJson; // Serialisasi JSON muatan mutasi
  late DateTime clientTimestamp;

  bool isSynced = false;

  int retryCount = 0;
  String? lastErrorMessage;
}
