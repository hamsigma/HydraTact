# DAFTAR TUGAS PENGEMBANGAN: HERVINO ISLAMI FASHA

**Penanggung Jawab (PIC):** `@Hervino`  
**Peran:** *Lead Architect & Fullstack Engineer*  
**Fokus Teknologi:** FastAPI (Python 3.11+), Pydantic v2, Next.js 14, Tailwind CSS, Leaflet.js, OpenAPI v3  
**Target Rilis:** MVP Kompetisi KMM AST-PTMA 2026  
**Standar Branch:** `<type>/<task-id>-<description>` (contoh: `feat/TASK-101-monorepo-setup`)  

---

## 📋 Matriks Tugas Personel

### Sprint 1 / Hari 1: Fondasi Repositori, Kontrak & Backend Skeleton
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-101`** | `P0` | `infra` | `chore/TASK-101-monorepo-setup` | Workspace `pnpm` + `Turborepo` + Python virtualenv aktif, skrip `lint`, `typecheck`, `test`, `build` terkonfigurasi. | `[ ]` |
| **`TASK-102`** | `P0` | `infra` | `chore/TASK-102-supabase-local-stack` *(Collab @Ilham)* | Supabase CLI local stack (`supabase init`) aktif untuk PostgreSQL 15/16 + PostGIS 3.4, Auth & Studio. | `[ ]` |
| **`TASK-103`** | `P0` | `contract` | `feat/TASK-103-pydantic-openapi-spec` | Model Pydantic v2 FastAPI mengekspor dokumen OpenAPI v3 (`openapi.yaml`) untuk seluruh endpoint. | `[ ]` |
| **`TASK-104`** | `P1` | `contract` | `feat/TASK-104-codegen-ts-dart` *(Collab @Ariyadi)* | Skrip generate otomatis dari kontrak OpenAPI ke TypeScript client (Web) dan Dart client (Flutter). | `[ ]` |

### Sprint 2 / Hari 2: Mesin Inti Peladen & FSM Siklus Hidup Insiden
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-201`** | `P0` | `backend` | `feat/TASK-201-fastapi-server-core` | Struktur dasar peladen REST FastAPI (Python 3.11+) + Pydantic v2 dengan router modular, `asyncpg`, dan validasi skema. | `[ ]` |
| **`TASK-204`** | `P0` | `backend` | `feat/TASK-204-incident-lifecycle-fsm` | Incident Lifecycle FSM (`PENDING_VERIFICATION` $\rightarrow$ `CLOSED`) di `packages/spatial-core/` + fitur Manual Override posko. | `[ ]` |
| **`TASK-205`** | `P0` | `backend` | `feat/TASK-205-fastapi-outbox-batch` | Endpoint FastAPI `POST /api/v1/sync/outbox-batch` dengan pengecekan kunci idempotensi (`mutation_uuid`). | `[ ]` |
| **`TASK-207`** | `P1` | `backend` | `feat/TASK-207-supabase-realtime-channels` | Konfigurasi Supabase Realtime CDC Channels untuk siaran instan status insiden, armada, dan barikade. | `[ ]` |
| **`TASK-208`** | `P1` | `backend` | `feat/TASK-208-rate-limiting-abuse` | Rate limiting (`slowapi`, $3\text{ req/mnt}$ per IP) dan validasi device fingerprint pada endpoint pelaporan warga. | `[ ]` |

### Sprint 3 / Hari 3: Citizen Emergency PWA & Dasbor Komando Posko
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-302`** | `P0` | `pwa` | `feat/TASK-302-citizen-pwa-zero-auth` | Halaman pelaporan warga tanpa login (*Zero-Auth*) dengan kunci geolokasi GPS otomatis (ukuran $< 150\text{ KB}$). | `[ ]` |
| **`TASK-303`** | `P0` | `pwa` | `feat/TASK-303-haptic-press-and-hold` *(Collab @Ariyadi)* | Tombol darurat Haptic Press-and-Hold ($2,0\text{ detik}$) dengan cincin progres visual SVG dan getaran haptic. | `[ ]` |
| **`TASK-304`** | `P1` | `pwa` | `feat/TASK-304-citizen-consensus-card` | Kartu status konsensus waktu nyata yang mengabarkan verifikasi otomatis kepada warga sekitar. | `[ ]` |
| **`TASK-305`** | `P0` | `web` | `feat/TASK-305-web-command-leaflet-dark` | Kanvas Leaflet.js tema gelap di Dasbor Posko: titik api, Sungai Karang Mumus pasang surut, dan sumber air. | `[ ]` |
| **`TASK-306`** | `P0` | `web` | `feat/TASK-306-auto-split-barricade-panel` | Visualisasi pembagian unit `ATTACKER`/`FEEDER` serta garis barikade selang fuchsia (`LineString`). | `[ ]` |
| **`TASK-307`** | `P1` | `web` | `feat/TASK-307-telemetry-stream-fsm-ui` | Panel Telemetry Stream kronologis dan tombol kendali transisi status operasi FSM bagi operator posko. | `[ ]` |

### Sprint 4 & 5 / Hari 4: Integrasi E2E, Load Testing & Luaran KMM
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-408`** | `P0` | `e2e` | `feat/TASK-408-e2e-integration-flow` | Integrasi alur lengkap: Lapor Warga $\rightarrow$ Auto-Konsensus $\rightarrow$ Posko Induk $\rightarrow$ Dispatch Armada Mobile. | `[ ]` |
| **`TASK-503`** | `P1` | `test` | `test/TASK-503-load-testing-k6` | Load testing k6 (100 permintaan konkuren pada endpoint pelaporan dan sumber air, latensi p95 $< 150\text{ ms}$). | `[ ]` |
| **`TASK-504`** | `P1` | `test` | `docs/TASK-504-sus-evaluation-report` *(Collab @Ariyadi)* | Evaluasi System Usability Scale (SUS) 5 skenario bersama 15 relawan Balakarcana (skor $\ge 75$). | `[ ]` |
| **`TASK-505`** | `P0` | `media` | `chore/TASK-505-video-demo-kmm` *(Collab Tim)* | Rekam dan edit video demo 5 menit (`04:20`) skenario Jl. Pelita Gg. 4 untuk YouTube panitia KMM. | `[ ]` |
| **`TASK-506`** | `P0` | `docs` | `docs/TASK-506-final-technical-report` *(Collab Tim)* | Finalisasi laporan teknis, repositori publik bersih, dan tautan luaran untuk pengumpulan akhir KMM. | `[ ]` |

---

## 🔗 Dependensi Utama
* **Menunggu dari @Ilham:** DDL Supabase PostGIS (`TASK-105`) untuk integrasi koneksi basis data FastAPI.
* **Menyediakan untuk @Ariyadi:** Kontrak OpenAPI v3 (`TASK-103`) untuk skrip code generation Dart klien mobile.
