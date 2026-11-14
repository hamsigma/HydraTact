import '../database/isar_service.dart';
import 'outbox_worker.dart';

/// Layanan Aksi Mutasi Optimistik (Optimistic UI Service)
/// Sesuai docs/Architecture.md Bagian 4:
/// Memperbarui state lokal seketika (< 100 ms) sebelum atau tanpa koneksi internet,
/// lalu mendaftarkan mutasi ke antrean Isar untuk dikirim oleh OutboxWorker.
class OptimisticMutationService {
  const OptimisticMutationService({
    required this.isarService,
    required this.outboxWorker,
  });

  final IsarService isarService;
  final OutboxWorker outboxWorker;

  /// Memperbarui status operasional hidran secara instan di UI dan mendaftarkan mutasi outbox
  Future<void> updateWaterSourceStatusOptimistic({
    required String serverId,
    required String newStatus,
    double? pressureBar,
    String? reason,
  }) async {
    final now = DateTime.now().toUtc();

    // 1. Simpan ke Cache Lokal seketika (Optimistic UI)
    await isarService.updateCachedWaterSourceStatus(
      serverId,
      newStatus,
      pressureBar: pressureBar,
      updatedAt: now,
    );

    // 2. Masukkan mutasi ke antrean outbox dengan client_timestamp (LWW guarantee)
    await outboxWorker.enqueue(
      endpoint: '/api/v1/water-sources/$serverId/status',
      httpMethod: 'PATCH',
      clientTimestamp: now,
      payload: {
        'source_id': serverId,
        'target_id': serverId,
        'status': newStatus,
        if (pressureBar != null) 'pressure_bar': pressureBar,
        if (reason != null) 'reason': reason,
      },
    );
  }

  /// Mengaktifkan atau menonaktifkan barikade selang jalan secara optimistik
  Future<void> toggleBarricadeOptimistic({
    required String barricadeId,
    required bool activate,
    String unitId = 'FDR-01',
    String reason = 'HOSE_CONNECTED',
  }) async {
    final now = DateTime.now().toUtc();

    if (activate) {
      await outboxWorker.enqueue(
        endpoint: '/api/v1/barricades',
        httpMethod: 'POST',
        clientTimestamp: now,
        payload: {
          'barricade_id': barricadeId,
          'target_id': barricadeId,
          'unit_id': unitId,
          'reason': reason,
          'is_active': true,
        },
      );
    } else {
      await outboxWorker.enqueue(
        endpoint: '/api/v1/barricades/$barricadeId/deactivate',
        httpMethod: 'PATCH',
        clientTimestamp: now,
        payload: {
          'barricade_id': barricadeId,
          'target_id': barricadeId,
          'is_active': false,
        },
      );
    }
  }

  /// Mengajukan permintaan tekanan pompa air unit attacker secara optimistik
  Future<void> requestWaterPressureOptimistic({
    required String unitId,
    required double targetPressureBar,
  }) async {
    final now = DateTime.now().toUtc();

    await outboxWorker.enqueue(
      endpoint: '/api/v1/units/$unitId/pressure-request',
      httpMethod: 'POST',
      clientTimestamp: now,
      payload: {
        'unit_id': unitId,
        'target_id': unitId,
        'target_pressure_bar': targetPressureBar,
      },
    );
  }
}
