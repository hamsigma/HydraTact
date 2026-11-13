# 03: Model Pydantic v2 & Ekspor Spesifikasi OpenAPI v3

**What to build:** Definisi skema model pertukaran data (Request & Response) menggunakan Pydantic v2 di `apps/backend-api` yang mengekspor berkas `packages/contracts/openapi.yaml` secara otomatis untuk titik akhir pelaporan warga, siklus FSM, dispatch armada, dan sinkronisasi outbox.

**Branch:** `feat/TASK-103-pydantic-openapi-spec`

**Blocked by:** 01: Inisialisasi Monorepo (pnpm + Turborepo + Python)

**Status:** ready-for-agent

- [ ] Model Pydantic v2 untuk `IncidentReportRequest`, `FSMTransitionRequest`, `UnitAssignRequest`, dan `OutboxBatchRequest` terdefinisi lengkap.
- [ ] Skrip `python -m apps.backend_api.export_openapi` berhasil menghasilkan berkas OpenAPI v3 yang valid.
- [ ] Seluruh format geometri GeoJSON (Point, LineString) mematuhi standar SRID 4326.
