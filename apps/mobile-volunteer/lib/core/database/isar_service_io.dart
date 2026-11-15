import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'schemas/cached_water_source.dart';
import 'schemas/sync_queue_item.dart';

/// Layanan Isar Database Lokal untuk Aplikasi Mobile Relawan
/// Sesuai docs/Database.md Bagian 4 & Architecture.md (Offline-First Outbox Pattern)
class IsarService {
  IsarService({this.name = 'hydratact_volunteer'});

  final String name;
  Isar? _isar;

  /// Mengembalikan instance Isar aktif
  Isar get isar {
    final instance = _isar;
    if (instance == null || !instance.isOpen) {
      throw StateError('IsarService belum diinisialisasi. Panggil open() terlebih dahulu.');
    }
    return instance;
  }

  /// Memeriksa apakah database Isar terbuka
  bool get isOpen => _isar != null && _isar!.isOpen;

  /// Membuka koneksi Isar Database lokal
  Future<void> open({String? directory, String? inspectorDirectory}) async {
    if (isOpen) return;

    final String dirPath;
    if (directory != null && directory.isNotEmpty) {
      dirPath = directory;
    } else {
      final appDir = await getApplicationDocumentsDirectory();
      dirPath = appDir.path;
    }

    _isar = await Isar.open(
      [SyncQueueItemSchema, CachedWaterSourceSchema],
      directory: dirPath,
      name: name,
      inspector: false,
    );
  }

  // =========================================================================
  // 1. Manajemen Antrean Mutasi (SyncQueueItem - Outbox Pattern)
  // =========================================================================

  /// Memasukkan mutasi luring ke antrean lokal (FIFO)
  Future<int> enqueueMutation(SyncQueueItem item) async {
    return isar.writeTxn(() async {
      return isar.syncQueueItems.put(item);
    });
  }

  /// Mengambil seluruh mutasi yang belum terkirim ke peladen (isSynced == false) terurut waktu
  Future<List<SyncQueueItem>> getPendingMutations() async {
    return isar.syncQueueItems
        .filter()
        .isSyncedEqualTo(false)
        .sortByClientTimestamp()
        .findAll();
  }

  /// Mengambil jumlah mutasi yang belum terkirim untuk indikator UI taktis
  Future<int> getPendingQueueCount() async {
    return isar.syncQueueItems.filter().isSyncedEqualTo(false).count();
  }

  /// Menandai mutasi telah berhasil dikirim dan diakui peladen
  Future<bool> markMutationSynced(String mutationUuid) async {
    return isar.writeTxn(() async {
      final item = await isar.syncQueueItems
          .filter()
          .mutationUuidEqualTo(mutationUuid)
          .findFirst();

      if (item != null) {
        item.isSynced = true;
        await isar.syncQueueItems.put(item);
        return true;
      }
      return false;
    });
  }

  /// Mencatat kegagalan percobaan pengiriman mutasi ke peladen
  Future<void> recordMutationFailure(String mutationUuid, String errorMessage) async {
    await isar.writeTxn(() async {
      final item = await isar.syncQueueItems
          .filter()
          .mutationUuidEqualTo(mutationUuid)
          .findFirst();

      if (item != null) {
        item.retryCount += 1;
        item.lastErrorMessage = errorMessage;
        await isar.syncQueueItems.put(item);
      }
    });
  }

  // =========================================================================
  // 2. Manajemen Cache Titik Sumber Air (CachedWaterSource)
  // =========================================================================

  /// Menyimpan atau memperbarui daftar titik sumber air ke penyimpanan luring
  Future<void> cacheWaterSources(List<CachedWaterSource> sources) async {
    await isar.writeTxn(() async {
      await isar.cachedWaterSources.putAll(sources);
    });
  }

  /// Mengambil seluruh titik sumber air dari penyimpanan lokal
  Future<List<CachedWaterSource>> getAllCachedWaterSources() async {
    return isar.cachedWaterSources.where().findAll();
  }

  /// Mengambil satu titik sumber air berdasarkan ID unik peladen
  Future<CachedWaterSource?> getWaterSourceByServerId(String serverId) async {
    return isar.cachedWaterSources
        .filter()
        .serverIdEqualTo(serverId)
        .findFirst();
  }

  /// Memperbarui status operasional sumber air secara lokal (Optimistic UI)
  Future<bool> updateCachedWaterSourceStatus(
    String serverId,
    String newStatus, {
    double? pressureBar,
    DateTime? updatedAt,
  }) async {
    return isar.writeTxn(() async {
      final source = await isar.cachedWaterSources
          .filter()
          .serverIdEqualTo(serverId)
          .findFirst();

      if (source != null) {
        source.operationalStatus = newStatus;
        if (pressureBar != null) source.pressureBar = pressureBar;
        source.updatedAt = updatedAt ?? DateTime.now().toUtc();
        await isar.cachedWaterSources.put(source);
        return true;
      }
      return false;
    });
  }

  // =========================================================================
  // 3. Utilitas Pembersihan & Penutupan
  // =========================================================================

  /// Membersihkan seluruh data lokal (untuk pengujian atau reset posko)
  Future<void> clearAll() async {
    await isar.writeTxn(() async {
      await isar.syncQueueItems.clear();
      await isar.cachedWaterSources.clear();
    });
  }

  /// Menutup database Isar
  Future<void> close() async {
    if (isOpen) {
      await _isar?.close();
      _isar = null;
    }
  }
}
