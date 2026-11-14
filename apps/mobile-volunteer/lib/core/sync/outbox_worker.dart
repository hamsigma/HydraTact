import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import '../database/isar_service.dart';
import '../database/schemas/sync_queue_item.dart';
import '../network/api_client.dart';
import '../network/models/enums.dart';
import '../network/models/sync_models.dart';

/// Helper UUID v4 generator sesuai RFC 4122
String generateUuidV4() {
  final random = Random.secure();
  final bytes = List<int>.generate(16, (_) => random.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  return [
    bytes.sublist(0, 4).map((b) => b.toRadixString(16).padLeft(2, '0')).join(),
    bytes.sublist(4, 6).map((b) => b.toRadixString(16).padLeft(2, '0')).join(),
    bytes.sublist(6, 8).map((b) => b.toRadixString(16).padLeft(2, '0')).join(),
    bytes.sublist(8, 10).map((b) => b.toRadixString(16).padLeft(2, '0')).join(),
    bytes.sublist(10, 16).map((b) => b.toRadixString(16).padLeft(2, '0')).join(),
  ].join('-');
}

/// Status Telemetri Sinkronisasi Outbox untuk UI Taktis
class OutboxStatus {
  const OutboxStatus({
    required this.isOnline,
    required this.pendingCount,
    required this.isSyncing,
    this.lastSyncTime,
  });

  final bool isOnline;
  final int pendingCount;
  final bool isSyncing;
  final DateTime? lastSyncTime;

  /// Format teks status antarmuka taktis tanpa embel-embel (No AI-slop)
  /// Sesuai docs/Design.md Bagian 7.2 & 8:
  /// - 'ONLINE (TERHUBUNG)'
  /// - 'OFFLINE (X ANTREAN)'
  /// - 'MENYINKRONKAN... (X)'
  String get tacticalStatusText {
    if (!isOnline) {
      return pendingCount > 0
          ? 'OFFLINE ($pendingCount ANTREAN)'
          : 'OFFLINE (TIDAK ADA SINYAL)';
    }
    if (isSyncing) {
      return 'MENYINKRONKAN... ($pendingCount)';
    }
    if (pendingCount > 0) {
      return 'ONLINE ($pendingCount ANTREAN)';
    }
    return 'ONLINE (TERHUBUNG)';
  }
}

/// Hasil Eksekusi Pembersihan Antrean (Flush Queue)
class FlushResult {
  const FlushResult({
    required this.processedCount,
    required this.successCount,
    required this.failedCount,
    this.errorMessage,
  });

  final int processedCount;
  final int successCount;
  final int failedCount;
  final String? errorMessage;

  bool get isSuccess => failedCount == 0 && errorMessage == null;
}

/// Background Outbox Worker untuk Aplikasi Mobile Relawan
/// Sesuai docs/Architecture.md Bagian 4 & Database.md:
/// - Menyimpan mutasi luring ke Isar DB secara lokal
/// - Memantau status konektivitas jaringan
/// - Mengirim antrean mutasi (FIFO) ke POST /api/v1/sync/outbox-batch begitu sinyal pulih
class OutboxWorker {
  OutboxWorker({
    required this.isarService,
    required this.apiClient,
    this.deviceId = 'dev-android-01',
    this.unitIdentifier = 'ATK-01',
    this.syncInterval = const Duration(seconds: 5),
    bool initialOnline = true,
  })  : _isOnline = initialOnline,
        _statusNotifier = ValueNotifier<OutboxStatus>(
          OutboxStatus(
            isOnline: initialOnline,
            pendingCount: 0,
            isSyncing: false,
          ),
        );

  final IsarService isarService;
  final HydraTactApiClient apiClient;
  final String deviceId;
  final String unitIdentifier;
  final Duration syncInterval;

  bool _isOnline;
  bool _isSyncing = false;
  Timer? _periodicTimer;
  final ValueNotifier<OutboxStatus> _statusNotifier;

  /// Notifier status untuk dikonsumsi oleh widget antarmuka (Tactical Header)
  ValueListenable<OutboxStatus> get statusNotifier => _statusNotifier;

  /// Status konektivitas saat ini
  bool get isOnline => _isOnline;

  /// Memulai pekerja sinkronisasi background dengan timer berkala
  Future<void> start() async {
    await refreshStatus();
    _periodicTimer?.cancel();
    _periodicTimer = Timer.periodic(syncInterval, (_) async {
      if (_isOnline && !_isSyncing) {
        await flushQueue();
      }
    });
  }

  /// Memperbarui status konektivitas (misal dari plugin connectivity / Airplane mode)
  /// Begitu sinyal 4G/LTE pulih (false -> true), otomatis memicu flush antrean FIFO
  Future<void> setConnectivity(bool online) async {
    final wasOffline = !_isOnline;
    _isOnline = online;

    await refreshStatus();

    if (wasOffline && online) {
      if (kDebugMode) {
        debugPrint('[OutboxWorker] Sinyal pulih! Memulai pengiriman antrean mutasi FIFO...');
      }
      await flushQueue();
    }
  }

  /// Memperbarui nilai notifier jumlah antrean
  Future<void> refreshStatus() async {
    int pending = 0;
    if (isarService.isOpen) {
      pending = await isarService.getPendingQueueCount();
    }
    _statusNotifier.value = OutboxStatus(
      isOnline: _isOnline,
      pendingCount: pending,
      isSyncing: _isSyncing,
      lastSyncTime: _statusNotifier.value.lastSyncTime,
    );
  }

  /// Memasukkan mutasi ke antrean Isar lokal (Optimistic Queueing)
  Future<SyncQueueItem> enqueue({
    required String endpoint,
    required String httpMethod,
    required Map<String, dynamic> payload,
    String? mutationUuid,
    DateTime? clientTimestamp,
  }) async {
    final uuid = mutationUuid ?? generateUuidV4();
    final timestamp = clientTimestamp ?? DateTime.now().toUtc();

    final item = SyncQueueItem()
      ..mutationUuid = uuid
      ..endpoint = endpoint
      ..httpMethod = httpMethod
      ..payloadJson = jsonEncode(payload)
      ..clientTimestamp = timestamp
      ..isSynced = false
      ..retryCount = 0;

    await isarService.enqueueMutation(item);
    await refreshStatus();

    // Jika perangkat saat ini memiliki koneksi internet, langsung kirim
    if (_isOnline && !_isSyncing) {
      unawaited(flushQueue());
    }

    return item;
  }

  /// Mengirim seluruh mutasi yang tertunda secara berurutan (FIFO) ke peladen
  Future<FlushResult> flushQueue() async {
    if (!_isOnline || _isSyncing) {
      return const FlushResult(processedCount: 0, successCount: 0, failedCount: 0);
    }

    _isSyncing = true;
    await refreshStatus();

    try {
      final pendingItems = await isarService.getPendingMutations();
      if (pendingItems.isEmpty) {
        _isSyncing = false;
        await refreshStatus();
        return const FlushResult(processedCount: 0, successCount: 0, failedCount: 0);
      }

      // Konversi item Isar ke DTO kontrak OpenAPI
      final List<OutboxMutationItemDto> dtoList = [];
      for (final item in pendingItems) {
        final Map<String, dynamic> payload = jsonDecode(item.payloadJson) as Map<String, dynamic>;
        final operation = _determineOperation(item.endpoint);
        final targetId = payload['target_id']?.toString() ??
            payload['source_id']?.toString() ??
            payload['barricade_id']?.toString() ??
            item.mutationUuid;

        dtoList.add(
          OutboxMutationItemDto(
            mutationUuid: item.mutationUuid,
            operation: operation,
            targetId: targetId,
            clientTimestamp: item.clientTimestamp,
            payload: payload,
          ),
        );
      }

      final batchRequest = OutboxBatchRequestDto(
        deviceId: deviceId,
        unitIdentifier: unitIdentifier,
        mutations: dtoList,
      );

      // Kirim batch ke peladen FastAPI (POST /api/v1/sync/outbox-batch)
      await apiClient.syncOutboxBatch(batchRequest);

      // Tandai item berhasil di Isar DB
      int successCount = 0;
      for (final item in pendingItems) {
        await isarService.markMutationSynced(item.mutationUuid);
        successCount++;
      }

      _isSyncing = false;
      _statusNotifier.value = OutboxStatus(
        isOnline: _isOnline,
        pendingCount: await isarService.getPendingQueueCount(),
        isSyncing: false,
        lastSyncTime: DateTime.now().toUtc(),
      );

      return FlushResult(
        processedCount: pendingItems.length,
        successCount: successCount,
        failedCount: 0,
      );
    } catch (e) {
      final errorMsg = e.toString();
      if (kDebugMode) {
        debugPrint('[OutboxWorker] Gagal mengirim mutasi batch: $errorMsg');
      }

      // Catat kegagalan pada antrean lokal
      try {
        final pendingItems = await isarService.getPendingMutations();
        for (final item in pendingItems) {
          await isarService.recordMutationFailure(item.mutationUuid, errorMsg);
        }
      } catch (_) {}

      _isSyncing = false;
      await refreshStatus();

      return FlushResult(
        processedCount: 0,
        successCount: 0,
        failedCount: 1,
        errorMessage: errorMsg,
      );
    }
  }

  MutationOperation _determineOperation(String endpoint) {
    if (endpoint.contains('water-sources')) {
      return MutationOperation.UPDATE_WATER_STATUS;
    }
    if (endpoint.contains('barricades')) {
      return MutationOperation.CREATE_BARRICADE;
    }
    return MutationOperation.UNIT_TELEMETRY_UPDATE;
  }

  /// Menutup pekerja sinkronisasi
  void dispose() {
    _periodicTimer?.cancel();
    _statusNotifier.dispose();
  }
}
