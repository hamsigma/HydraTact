# DAFTAR TUGAS PENGEMBANGAN: ARIYADI

**Penanggung Jawab (PIC):** `@Ariyadi`  
**Peran:** *UI/UX & Mobile Engineer*  
**Fokus Teknologi:** Flutter 3.x (Dart), Isar Database 3.1, `flutter_map_mbtiles`, `supabase_flutter`, Ergonomi Taktis  
**Target Rilis:** MVP Kompetisi KMM AST-PTMA 2026  
**Standar Branch:** `<type>/<task-id>-<description>` (contoh: `feat/TASK-401-flutter-mbtiles-renderer`)  

---

## 📋 Matriks Tugas Personel

### Sprint 1 / Hari 1: Desain Ergonomi Taktis, Scaffold Flutter & Peta Luring
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-104`** | `P1` | `contract` | `feat/TASK-104-codegen-ts-dart` *(Collab @Hervino)* | Skrip generate otomatis dari kontrak OpenAPI ke Dart client (Flutter). | `[x]` |
| **`TASK-301`** | `P0` | `ui/ux` | `feat/TASK-301-tactical-design-tokens` | Token desain taktis tema gelap (`#07090E` s.d. `#141923`), kontras $\ge 7:1$ (WCAG AAA), angka `tabular-nums`, bebas pill chips. | `[x]` |
| **`TASK-401`** | `P0` | `mobile` | `feat/TASK-401-flutter-mbtiles-renderer` | Proyek Flutter Android disiapkan, aset `.mbtiles` terbundel dan dirender via `flutter_map_mbtiles` ($< 500\text{ ms}$). | `[x]` |

### Sprint 2 / Hari 2: Antarmuka Peran Taktis, Isar DB & Outbox Queue
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-403`** | `P0` | `mobile` | `feat/TASK-403-mobile-role-views` | Antarmuka adaptif `ATTACKER` (merah, tombol minta tekanan $64\text{ dp}$) vs `FEEDER` (kuning, parkir & barikade). | `[x]` |
| **`TASK-406`** | `P0` | `mobile` | `feat/TASK-406-isar-sync-queue-schema` | Skema Isar DB `SyncQueueItem` & `CachedWaterSource` untuk penyimpanan luring perangkat. | `[x]` |
| **`TASK-407`** | `P0` | `mobile` | `feat/TASK-407-outbox-worker-optimistic` | Optimistic UI dan Background Outbox Worker yang memantau konektivitas dan mengirim antrean mutasi (FIFO) saat sinyal pulih. | `[x]` |

### Sprint 3 / Hari 3: Tombol Haptic PWA, Map-Matching & Aksi Taktis 1-Tap
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-303`** | `P0` | `pwa` | `feat/TASK-303-haptic-press-and-hold` *(Collab @Hervino)* | Desain & implementasi tombol darurat Haptic Press-and-Hold ($2,0\text{ detik}$) dengan cincin progres visual dan getaran haptic. | `[ ]` |
| **`TASK-402`** | `P1` | `mobile` | `feat/TASK-402-map-matching-snapping` *(Collab @Ilham)* | Client-Side Map-Matching Snapping untuk mengunci GPS mentah ke gang jika deviasi multipath $\le 25\text{ m}$. | `[x]` |
| **`TASK-404`** | `P0` | `mobile` | `feat/TASK-404-nearest-water-sources-ui` | Modul 3 Sumber Air Terdekat menggunakan Haversine lokal dan filter status (`READY` / `LOW_DISCHARGE`). | `[x]` |
| **`TASK-405`** | `P0` | `mobile` | `feat/TASK-405-tap-water-barricade-actions` | Aksi 1-Tap status air dan sakelar Hose Barricade dengan target sentuh ramah sarung tangan ($\ge 48\text{ dp}$). | `[x]` |

### Sprint 4 & 5 / Hari 4: Uji Stres Luring, Evaluasi SUS & Video Demo KMM
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-502`** | `P0` | `test` | `test/TASK-502-airplane-mode-stress-test` | Pengujian offline fisik Android: simulasikan 10 mutasi luring, restart aplikasi, dan verifikasi antrean sinkronisasi utuh. | `[ ]` |
| **`TASK-504`** | `P1` | `test` | `docs/TASK-504-sus-evaluation-report` *(Collab @Hervino)* | Pengujian System Usability Scale (SUS) 5 skenario bersama 15 relawan Balakarcana (target skor $\ge 75$). | `[ ]` |
| **`TASK-505`** | `P0` | `media` | `chore/TASK-505-video-demo-kmm` *(Collab Tim)* | Rekam dan edit video demo 5 menit (`04:20`) skenario Jl. Pelita Gg. 4 untuk YouTube panitia KMM. | `[ ]` |
| **`TASK-506`** | `P0` | `docs` | `docs/TASK-506-final-technical-report` *(Collab Tim)* | Finalisasi dokumen teknis, repositori publik bersih, dan tautan luaran untuk pengumpulan akhir KMM. | `[ ]` |

---

## 🔗 Dependensi Utama
* **Menunggu dari @Ilham:** Berkas `samarinda_dense.mbtiles` (`TASK-109`) untuk diuji pada renderer luring Flutter.
* **Menunggu dari @Hervino:** Kontrak OpenAPI v3 (`TASK-103`) untuk pembuatan klien API Dart.
