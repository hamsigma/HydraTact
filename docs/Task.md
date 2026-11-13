# DAFTAR TUGAS PENGEMBANGAN & BACKLOG (TASK TRACKER)

**Nama Proyek:** HydraTact Samarinda  
**Target Rilis:** MVP Kompetisi KMM AST-PTMA 2026  
**Struktur Kerja:** Monorepo (`pnpm` + `Turborepo`)  

**Pembagian Peran Tim (PIC):**
* **`@Hervino`** — *Lead Architect & Fullstack Engineer* (Backend API, Web Command Center, PWA Warga, OpenAPI Contract)
* **`@Ilham`** — *Data & Spatial Backend Engineer* (PostgreSQL/PostGIS, Algoritma Spasial, Pipeline `.mbtiles` Samarinda)
* **`@Ariyadi`** — *UI/UX & Mobile Engineer* (Desain Ergonomi Darurat, Aplikasi Flutter Android, Isar DB & Offline Sync)

---

## SPRINT 1: Fondasi Monorepo, Basis Data Spasial, & Peta Luring

### 1.1 Inisialisasi Repositori & Kontrak API
- [x] **`TASK-101`** `[P0]` `@Hervino` — Inisialisasi struktur monorepo (`pnpm` + `Turborepo` + Python virtualenv) dengan direktori `apps/backend-api` (FastAPI), `apps/web-command`, `apps/pwa-citizen`, `apps/mobile-volunteer`, `supabase/`, dan `packages/*`.
- [ ] **`TASK-102`** `[P0]` `@Hervino` & `@Ilham` — Konfigurasi Supabase CLI local stack (`supabase init` / `config.toml`) mencakup PostgreSQL + PostGIS, Supabase Auth, Studio, dan Realtime Engine.
- [x] **`TASK-103`** `[P0]` `@Hervino` — Susun skema model data Pydantic v2 di FastAPI untuk mengekspor spesifikasi `openapi.yaml` (OpenAPI v3) otomatis mencakup endpoint pelaporan, dispatching, dan outbox sync.
- [x] **`TASK-104`** `[P1]` `@Hervino` & `@Ariyadi` — Konfigurasi skrip *code generation* otomatis dari kontrak OpenAPI ke klien TypeScript (Web/PWA) dan Dart (Flutter).

### 1.2 Skema Database Supabase PostGIS & Data Wilayah Samarinda
- [x] **`TASK-105`** `[P0]` `@Ilham` — Implementasi skrip migrasi DDL Supabase PostGIS (`supabase/migrations/`), tipe `ENUM` (FSM, peran unit, status air), indeks spasial `GIST`, dan publikasi replikasi `supabase_realtime`.
- [x] **`TASK-106`** `[P0]` `@Ilham` — Susun skrip *seeding* data wilayah Kota Samarinda di `supabase/seed.sql` (posko relawan Balakarcana/PMK, 30 titik hidran PDAM, tandon warga, dermaga Sungai Karang Mumus, dan skenario uji Jl. Pelita Gg. 4).
- [x] **`TASK-107`** `[P1]` `@Ilham` — Bangun kueri spasial teroptimasi untuk evaluasi radius konsensus ($r \le 100\text{ m}$) dan pencarian 3 sumber air aktif terdekat menggunakan operator jarak PostGIS (`<->`).

### 1.3 Pipeline Ekstraksi Peta Vektor `.mbtiles`
- [ ] **`TASK-108`** `[P0]` `@Ilham` — Ekstraksi data jaringan jalan lingkungan dan gang sempit (`highway=residential`, `living_street`, `alley`, `footway`) Kota Samarinda dari OpenStreetMap (`.osm.pbf`).
- [ ] **`TASK-109`** `[P1]` `@Ilham` — Jalankan kompilasi petak vektor menggunakan **Tippecanoe** (*zoom level* 14--18) menjadi berkas `samarinda_dense.mbtiles` dengan ukuran terkompresi $\le 45\text{ MB}$.
  * *Kriteria Selesai:* Berkas berhasil dirender tanpa koneksi internet dan menampilkan lebar serta geometri gang Jl. Pelita Gg. 4 secara akurat.

---

## SPRINT 2: Mesin Inti Peladen & Algoritma Taktis (`apps/backend-api` & `packages/spatial-core`)

### 2.1 Mesin Konsensus & Pembagian Peran Otomatis
- [x] **`TASK-201`** `[P0]` `@Hervino` — Bangun struktur dasar peladen REST menggunakan **FastAPI (Python 3.11+)** + Pydantic v2 dengan router modular, asinkron (`asyncpg`), dan validasi skema ketat.
- [x] **`TASK-202`** `[P0]` `@Ilham` — Implementasi fungsi murni **Geofencing Consensus Engine** di `packages/spatial-core`: verifikasi otomatis insiden jika terdapat $\ge 2$ laporan unik dalam radius $\le 100\text{ m}$ dan selang waktu $\le 3\text{ menit}$.
- [x] **`TASK-203`** `[P0]` `@Ilham` — Implementasi algoritma **Dynamic Role Dispatching (*Auto-Split*)**:
  * Tetapkan `FEEDER` untuk armada berkapasitas $\ge 3.000\text{ L}$ jika lebar jalan $< 2,5\text{ m}$.
  * Tetapkan `ATTACKER` untuk armada berkapasitas $< 1.000\text{ L}$ (tossa roda tiga / pompa jinjing) jika lebar jalan $< 2,5\text{ m}$.
- [ ] **`TASK-204`** `[P0]` `@Hervino` — Implementasi **Incident Lifecycle Finite State Machine (FSM)** (`PENDING_VERIFICATION` $\rightarrow$ `VERIFIED` $\rightarrow$ `DISPATCHING` $\rightarrow$ `SUPPRESSION_ACTIVE` $\rightarrow$ `OVERHAUL_COOLING` $\rightarrow$ `INCIDENT_CLOSED` $\rightarrow$ `ARCHIVED`) beserta fitur *Manual Override* operator.

### 2.2 Sinkronisasi Outbox & Saluran Waktu Nyata
- [ ] **`TASK-205`** `[P0]` `@Hervino` — Bangun *endpoint* FastAPI `POST /api/v1/sync/outbox-batch` dengan pengecekan kunci idempotensi (`mutation_uuid`) pada tabel `telemetry_mutation_logs`.
- [ ] **`TASK-206`** `[P0]` `@Ilham` — Terapkan aturan resolusi konflik **Last-Write-Wins (LWW)** berbasis `client_timestamp` pada pembaruan status sumber air dan barikade jalan.
- [ ] **`TASK-207`** `[P1]` `@Hervino` — Konfigurasi **Supabase Realtime (CDC WebSocket Channels)** untuk menyiarkan perubahan status insiden, posisi unit, dan garis barikade selang secara instan ke seluruh klien aktif.
- [ ] **`TASK-208`** `[P1]` `@Hervino` — Tambahkan *Rate Limiting* (`slowapi`, $3\text{ permintaan/menit}$ per IP) dan validasi *device fingerprint* pada *endpoint* pelaporan publik warga.

---

## SPRINT 3: Aplikasi Klien Web (PWA Warga & Dasbor Komando Posko)

### 3.1 Sistem Desain & Ergonomi Kondisi Darurat
- [ ] **`TASK-301`** `[P0]` `@Ariyadi` — Susun token desain taktis tema gelap (*dark mode* `#07090E` -- `#141923`) dengan rasio kontras teks minimal $7:1$ (WCAG AAA) dan tipografi angka `tabular-nums`.

### 3.2 PWA Pelaporan Darurat Warga (`apps/pwa-citizen`)
- [ ] **`TASK-302`** `[P0]` `@Hervino` — Bangun halaman pelaporan tanpa login (*Zero-Auth*) dengan kunci geolokasi GPS otomatis dan indikator akurasi koordinat.
- [ ] **`TASK-303`** `[P0]` `@Ariyadi` & `@Hervino` — Implementasi tombol darurat **Haptic Press-and-Hold (2,0 detik)** dengan cincin progres visual dan umpan balik getar (*Vibration API*) untuk mencegah laporan tidak sengaja.
- [ ] **`TASK-304`** `[P1]` `@Hervino` — Bangun kartu status konsensus waktu nyata yang memberi tahu warga saat laporannya telah terverifikasi bersama warga sekitar.

### 3.3 Dasbor Komando Posko Induk (`apps/web-command`)
- [ ] **`TASK-305`** `[P0]` `@Hervino` — Integrasikan kanvas peta interaktif **Leaflet.js** tema gelap yang menampilkan titik api, koridor Sungai Karang Mumus (beserta indikator elevasi pasang surut), dan direktori sumber air.
- [ ] **`TASK-306`** `[P0]` `@Hervino` — Bangun panel kontrol *Auto-Split* armada yang memvisualisasikan pembagian unit `ATTACKER` (masuk gang) dan `FEEDER` (bersiaga di jalan arteri) serta garis barikade selang berwarna fuchsia (`LineString`).
- [ ] **`TASK-307`** `[P1]` `@Hervino` — Tambahkan panel *Telemetry Stream* kronologis dan kontrol transisi tahap operasi FSM bagi operator posko.

---

## SPRINT 4: Aplikasi Mobile Relawan Offline-First (`apps/mobile-volunteer`)

### 4.1 Peta Luring & Koreksi GPS Gang Sempit
- [ ] **`TASK-401`** `[P0]` `@Ariyadi` — Bundel berkas `samarinda_dense.mbtiles` ke dalam aset Flutter dan konfigurasikan renderer vektor luring (`flutter_map_mbtiles`).
  * *Kriteria Selesai:* Peta terender dalam $< 500\text{ ms}$ saat ponsel dalam *Airplane Mode*.
- [ ] **`TASK-402`** `[P1]` `@Ariyadi` & `@Ilham` — Implementasi **Client-Side Map-Matching Snapping** untuk mengunci titik GPS mentah ke garis jaringan gang terdekat jika terjadi *multipath drift* ($\le 25\text{ m}$).

### 4.2 Antarmuka Peran Taktis & Manajemen Logistik Air
- [ ] **`TASK-403`** `[P0]` `@Ariyadi` — Bangun tampilan adaptif berbasis peran penugasan:
  * **Mode `ATTACKER` (Aksen Merah):** Navigasi lorong menuju titik api, penghitung jarak meter, dan tombol besar ($64\text{ dp}$) *Minta Tekanan Air*.
  * **Mode `FEEDER` (Aksen Amber/Kuning):** Titik parkir aman di jalan utama, pemantau kapasitas tangki, dan sakelar barikade selang jalan.
- [ ] **`TASK-404`** `[P0]` `@Ariyadi` — Bangun modul **3 Sumber Air Terdekat** menggunakan kalkulasi jarak Haversine lokal dan filter status (`READY` / `LOW_DISCHARGE`).
- [ ] **`TASK-405`** `[P0]` `@Ariyadi` — Implementasi lembar cepat **1-Tap Water Status Update** dan sakelar **Hose Barricade Toggle** dengan target sentuh ramah sarung tangan ($\ge 48\text{ dp}$).

### 4.3 Penyimpanan Lokal Isar DB & Pekerja Sinkronisasi Outbox
- [ ] **`TASK-406`** `[P0]` `@Ariyadi` — Konfigurasi koleksi lokal `SyncQueueItem` dan `CachedWaterSource` menggunakan **Isar Database**.
- [ ] **`TASK-407`** `[P0]` `@Ariyadi` — Implementasi **Optimistic UI** dan **Background Outbox Worker** yang memantau perubahan status konektivitas dan mengirimkan antrean mutasi secara berurutan (FIFO) begitu sinyal pulih.

---

## SPRINT 5: Pengujian Terpadu, Validasi Lapangan, & Kelengkapan Kompetisi

### 5.1 Pengujian Otomatis & Uji Stres Sistem
- [ ] **`TASK-501`** `[P0]` `@Ilham` — Tulis *unit test* untuk algoritma *Dynamic Role Dispatching*, rumus jarak Haversine, dan transisi FSM (target cakupan kode $\ge 80\%$).
- [ ] **`TASK-502`** `[P0]` `@Ariyadi` — Lakukan **Airplane Mode Stress Test**: simulasikan 10 mutasi status air dan barikade secara luring, matikan/hidupkan ulang aplikasi, lalu verifikasi seluruh antrean tersinkronisasi tanpa duplikasi saat sinyal aktif kembali.
- [ ] **`TASK-503`** `[P1]` `@Hervino` — Jalankan *load testing* (k6 / Artillery) dengan 100 permintaan konkuren pada *endpoint* pelaporan dan pencarian sumber air terdekat (target latensi p95 $< 150\text{ ms}$).

### 5.2 Uji Kegunaan Pengguna & Penyusunan Luaran KMM AST-PTMA 2026
- [ ] **`TASK-504`** `[P1]` `@Ariyadi` & `@Hervino` — Lakukan pengujian kegunaan (*System Usability Scale* / SUS) terhadap 5 skenario kritis bersama 15 personel relawan pemadam kebakaran di Kota Samarinda (target skor SUS $\ge 75$).
- [ ] **`TASK-505`** `[P0]` `@Hervino`, `@Ilham`, `@Ariyadi` — Rekam dan sunting video demonstrasi perangkat lunak berdurasi maksimal 5 menit (`04:20`) sesuai naskah skenario Jl. Pelita Gg. 4 dan unggah ke YouTube sesuai format penamaan panitia.
- [ ] **`TASK-506`** `[P0]` `@Hervino`, `@Ilham`, `@Ariyadi` — Finalisasi laporan teknis, berkas `PRD.md`, `ARSITEKTUR.md`, `DATABASE.md`, dan tautan repositori kode sumber untuk pengumpulan akhir.