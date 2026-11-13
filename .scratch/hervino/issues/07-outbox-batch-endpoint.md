# 07: Endpoint Pemrosesan Batch Outbox Luring (Idempotensi)

**What to build:** Titik akhir `POST /api/v1/sync/outbox-batch` pada FastAPI yang menerima larik mutasi offline dari ponsel relawan, menjalankan pengecekan idempotensi terhadap tabel `telemetry_mutation_logs` (`mutation_uuid`), dan mengeksekusi mutasi secara atomik.

**Branch:** `feat/TASK-205-fastapi-outbox-batch`

**Blocked by:** 05: Kerangka Peladen REST FastAPI & Koneksi Database

**Status:** ready-for-agent

- [ ] Skema `OutboxBatchRequest` memvalidasi larik mutasi dengan kunci idempotensi UUID v4.
- [ ] Pengiriman duplikat dari perangkat tidak menggandakan mutasi di basis data (HTTP 200 dengan status duplikat diabaikan).
- [ ] Riwayat mutasi tersimpan rapi pada tabel log telemetri.
