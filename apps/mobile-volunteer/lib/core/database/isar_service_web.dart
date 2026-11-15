import 'schemas/cached_water_source.dart';
import 'schemas/sync_queue_item.dart';

/// Implementasi web (Chrome) untuk layanan database lokal.
/// Isar tidak mendukung web, sehingga antrean outbox & cache sumber air
/// disimpan sementara di memori — cukup untuk preview desain & demo UI.
class IsarService {
  IsarService({this.name = 'hydratact_volunteer'});

  final String name;

  final List<SyncQueueItem> _syncQueue = [];
  final Map<String, CachedWaterSource> _waterSources = {};
  int _nextId = 1;
  bool _opened = false;

  bool get isOpen => _opened;

  Future<void> open({String? directory, String? inspectorDirectory}) async {
    // Di web parameter directory diabaikan (API identik dengan versi Isar)
    _opened = true;
  }

  // =========================================================================
  // 1. Manajemen Antrean Mutasi (Outbox Pattern)
  // =========================================================================

  Future<int> enqueueMutation(SyncQueueItem item) async {
    item.localId = _nextId++;
    _syncQueue.add(item);
    return item.localId;
  }

  Future<List<SyncQueueItem>> getPendingMutations() async {
    final pending = _syncQueue.where((item) => !item.isSynced).toList()
      ..sort((a, b) => a.clientTimestamp.compareTo(b.clientTimestamp));
    return pending;
  }

  Future<int> getPendingQueueCount() async {
    return _syncQueue.where((item) => !item.isSynced).length;
  }

  Future<bool> markMutationSynced(String mutationUuid) async {
    for (final item in _syncQueue) {
      if (item.mutationUuid == mutationUuid) {
        item.isSynced = true;
        return true;
      }
    }
    return false;
  }

  Future<void> recordMutationFailure(String mutationUuid, String errorMessage) async {
    for (final item in _syncQueue) {
      if (item.mutationUuid == mutationUuid) {
        item.retryCount += 1;
        item.lastErrorMessage = errorMessage;
      }
    }
  }

  // =========================================================================
  // 2. Manajemen Cache Titik Sumber Air
  // =========================================================================

  Future<void> cacheWaterSources(List<CachedWaterSource> sources) async {
    for (final source in sources) {
      _waterSources[source.serverId] = source;
    }
  }

  Future<List<CachedWaterSource>> getAllCachedWaterSources() async {
    return _waterSources.values.toList();
  }

  Future<CachedWaterSource?> getWaterSourceByServerId(String serverId) async {
    return _waterSources[serverId];
  }

  Future<bool> updateCachedWaterSourceStatus(
    String serverId,
    String newStatus, {
    double? pressureBar,
    DateTime? updatedAt,
  }) async {
    final source = _waterSources[serverId];
    if (source != null) {
      source.operationalStatus = newStatus;
      if (pressureBar != null) source.pressureBar = pressureBar;
      source.updatedAt = updatedAt ?? DateTime.now().toUtc();
      return true;
    }
    return false;
  }

  // =========================================================================
  // 3. Utilitas Pembersihan & Penutupan
  // =========================================================================

  Future<void> clearAll() async {
    _syncQueue.clear();
    _waterSources.clear();
  }

  Future<void> close() async {
    _opened = false;
  }
}
