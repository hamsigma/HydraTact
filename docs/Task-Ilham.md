# DAFTAR TUGAS PENGEMBANGAN: ILHAM RAMADHANI

**Penanggung Jawab (PIC):** `@Ilham`  
**Peran:** *Data & Spatial Backend Engineer*  
**Fokus Teknologi:** Supabase, PostgreSQL 15/16, PostGIS 3.4, OpenStreetMap, Tippecanoe (`.mbtiles`), GeoJSON, Shapely  
**Target Rilis:** MVP Kompetisi KMM AST-PTMA 2026  
**Standar Branch:** `<type>/<task-id>-<description>` (contoh: `feat/TASK-105-supabase-postgis-ddl`)  

---

## 📋 Matriks Tugas Personel

### Sprint 1 / Hari 1: Skema Database Spasial, Seeding & Pipeline MBTiles
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-102`** | `P0` | `infra` | `chore/TASK-102-supabase-local-stack` *(Collab @Hervino)* | Konfigurasi Supabase CLI local stack (`supabase init`) untuk PostgreSQL 15/16 + PostGIS 3.4, Auth & Studio. | `[ ]` |
| **`TASK-105`** | `P0` | `database` | `feat/TASK-105-supabase-postgis-ddl` | Skrip migrasi DDL Supabase PostGIS (`supabase/migrations/`), tipe ENUM, indeks GiST, dan replikasi `supabase_realtime`. | `[x]` |
| **`TASK-106`** | `P0` | `database` | `feat/TASK-106-seeding-samarinda-data` | Seeding data wilayah di `supabase/seed.sql`: posko Balakarcana, 30 titik hidran/tandon, dan skenario uji Jl. Pelita Gg. 4. | `[x]` |
| **`TASK-107`** | `P1` | `database` | `feat/TASK-107-spatial-queries-gist` | Kueri spasial teroptimasi untuk konsensus radius $\le 100\text{ m}$ dan 3 sumber air aktif terdekat (`<->`). | `[x]` |
| **`TASK-108`** | `P0` | `spatial` | `feat/TASK-108-osm-samarinda-extract` | Ekstraksi jalan lingkungan dan gang sempit Samarinda dari OpenStreetMap (`.osm.pbf`). | `[x]` |
| **`TASK-109`** | `P1` | `spatial` | `feat/TASK-109-tippecanoe-mbtiles` | Kompilasi Tippecanoe zoom 14--18 menghasilkan `samarinda_dense.mbtiles` ($\le 45\text{ MB}$, Jl. Pelita Gg. 4 akurat). | `[x]` |

### Sprint 2 / Hari 2: Mesin Konsensus Geofencing & Dynamic Role Dispatching
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-202`** | `P0` | `spatial` | `feat/TASK-202-geofencing-consensus` | Mesin konsensus murni di `packages/spatial-core`: evaluasi $\ge 2$ laporan unik ($r \le 100\text{ m}, \Delta t \le 3\text{ mnt}$). | `[x]` |
| **`TASK-203`** | `P0` | `spatial` | `feat/TASK-203-dynamic-role-dispatching` | Logika Auto-Split peran: `FEEDER` ($\ge 3.000\text{ L}$) vs `ATTACKER` ($< 1.000\text{ L}$) pada jalan $< 2,5\text{ m}$. | `[x]` |
| **`TASK-206`** | `P0` | `backend` | `feat/TASK-206-last-write-wins-resolution` | Resolusi konflik Last-Write-Wins (LWW) berbasis `client_timestamp` pada status air dan barikade jalan. | `[x]` |

### Sprint 3 / Hari 3: Algoritma Map-Matching Snapping
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-402`** | `P1` | `spatial` | `feat/TASK-402-map-matching-snapping` *(Collab @Ariyadi)* | Logika Client-Side Map-Matching Snapping untuk mengunci GPS mentah ke gang jika deviasi multipath $\le 25\text{ m}$. | `[x]` |

### Sprint 4 & 5 / Hari 4: Unit Testing Spasial & Video Demonstrasi KMM
| Task ID | Pri | Modul | Nama Tugas & Cabang Branch | Acceptance Criteria / Output | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **`TASK-501`** | `P0` | `test` | `test/TASK-501-spatial-unit-tests` | Unit test algoritma Dynamic Role Dispatching, Haversine, dan FSM (cakupan kode $\ge 80\%$). | `[ ]` |
| **`TASK-505`** | `P0` | `media` | `chore/TASK-505-video-demo-kmm` *(Collab Tim)* | Rekam dan edit video demo 5 menit (`04:20`) skenario Jl. Pelita Gg. 4 untuk YouTube panitia KMM. | `[ ]` |
| **`TASK-506`** | `P0` | `docs` | `docs/TASK-506-final-technical-report` *(Collab Tim)* | Finalisasi dokumen teknis, repositori publik bersih, dan tautan luaran untuk pengumpulan akhir KMM. | `[ ]` |

---

## 🔗 Dependensi Utama
* **Menyediakan untuk @Ariyadi:** Berkas `samarinda_dense.mbtiles` (`TASK-109`) sebelum Ariyadi mengonfigurasi renderer luring Flutter.
* **Menyediakan untuk @Hervino:** Skrip DDL Supabase PostGIS (`TASK-105`) dan fungsi konsensus geospasial (`TASK-202`).
