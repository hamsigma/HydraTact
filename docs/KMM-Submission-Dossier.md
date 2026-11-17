# BERKAS DOSSIER LUARAN KOMPETISI KMM AST-PTMA 2026
## Proyek: HydraTact Samarinda — Sistem Taktis Pemadaman Kebakaran Permukiman Padat Tepian Mahakam

---

### 1. Lembar Identitas & Ringkasan Eksekutif

- **Nama Karya:** HydraTact Samarinda
- **Kategori:** Piranti Lunak / Smart City & Tanggap Bencana
- **Target Kompetisi:** Kompetisi Mahasiswa Muhammadiyah (KMM) AST-PTMA 2026
- **Struktur Repositori:** Monorepo (`pnpm` + `Turborepo` + Python virtualenv)
- **Komposisi Tim:**
  - **@Hervino:** *Lead Architect & Fullstack Engineer* (Backend API, Web Command, PWA Citizen)
  - **@Ilham:** *Data & Spatial Backend Engineer* (PostGIS, Consensus Engine, Pipeline MBTiles)
  - **@Ariyadi:** *UI/UX & Mobile Engineer* (Flutter Offline-First, Isar DB, Ergonomi Darurat)

---

### 2. Latar Belakang Masalah Riil Kota Samarinda

Kawasan permukiman tepian Sungai Karang Mumus (SKM) dan Sungai Mahakam (seperti Jl. Pelita, Lambung Mangkurat, Pasar Segiri, dan Karang Asam) memiliki karakteristik unik dengan risiko kebakaran katastropik tinggi:
1. **Gang Sempit & Akses Terbatas:** Mayoritas lebar jalan lingkungan $< 2.5\text{ meter}$, mustahil dilalui unit pemadam tangki besar ($\ge 3.000\text{ L}$).
2. **Keterbatasan Pasokan Air & Pasang Surut Sungai:** Fluktuasi elevasi pasang surut SKM (-0.2 m s.d. +2.1 m) mempengaruhi kemampuan hisap pompa apung.
3. **Blank Spot Sinyal & Multipath GPS Drift:** Dinding beton dan atap seng menyebabkan pantulan sinyal GPS melenceng hingga $25\text{ meter}$ dari sumbu gang.
4. **Laporan Palsu (*Prank Reports*):** Dibutuhkan mekanisme konsensus spasial tanpa login warga (*zero-auth*) yang mampu memvalidasi kebenaran insiden sebelum armada dikerahkan.

---

### 3. Solusi Inovasi Taktis 4-Pilar HydraTact

```
                 +-------------------------------------------+
                 |    Citizen PWA (Zero-Auth + Haptic 2s)    |
                 +-------------------------------------------+
                                       |
                                       v
        +-------------------------------------------------------------+
        |  Consensus Engine (>= 2 Laporan, r <= 100m, dt <= 3 mnt)    |
        +-------------------------------------------------------------+
                                       |
                  +--------------------+--------------------+
                  v                                         v
   +------------------------------+          +------------------------------+
   |   Web Command Center Posko   |          |    Mobile Volunteer Flutter  |
   |   - Auto-Split Matrix        |          |    - Offline MBTiles (14-18) |
   |   - Fuchsia Barricade Layer  |          |    - Isar DB Outbox Worker   |
   |   - 30 Titik Air Samarinda   |          |    - Snapping Multipath <=25m|
   +------------------------------+          +------------------------------+
```

1. **Mesin Konsensus Spasial Anti-Prank (TASK-202):**
   - Menahan laporan tunggal dalam status `PENDING_VERIFICATION`.
   - Mengubah status otomatis menjadi `VERIFIED` saat $\ge 2$ warga unik melapor dalam radius $\le 100\text{ meter}$ dan rentang waktu $\le 3\text{ menit}$.
2. **Dynamic Role Dispatching Auto-Split (TASK-203):**
   - Armada tangki besar ($\ge 3.000\text{ L}$) otomatis dialokasikan sebagai `FEEDER` (posisi parkir di jalan arteri $\ge 6\text{ m}$).
   - Armada roda tiga / pompa jinjing ($< 1.000\text{ L}$) otomatis dialokasikan sebagai `ATTACKER` (masuk ke lorong api).
3. **Peta Vektor Luring & Map-Matching Snapping (TASK-401 & TASK-402):**
   - Peta vektor luring `samarinda_dense.mbtiles` terbundel lokal, render $< 500\text{ ms}$ saat *airplane mode*.
   - Algoritma proyeksi tegak lurus mengunci koordinat GPS yang melenceng ($\le 25\text{ m}$) kembali ke garis tengah gang.
4. **Garis Barikade Selang Fuchsia & Loop Tekanan (TASK-306 & TASK-405):**
   - Menghubungkan unit `FEEDER` ke `ATTACKER` dengan garis selang fuchsia (`#C026D3`) dan mengunci jalan lintasan selang dari kendaraan umum.

---

### 4. Matriks Verifikasi & Hasil Uji Sistem

| Komponen Uji | Metrik Keberhasilan | Hasil Aktual | Status |
| :--- | :--- | :--- | :---: |
| **Backend API Tests** | 100% test lulus, FSM deterministik | 20 / 20 tests pass (0.298s) | **LULUS** |
| **Web Command Tests** | Auto-split, real-world OSM, Leaflet canvas | 25 / 25 tests pass (0.753s) | **LULUS** |
| **Citizen PWA Tests** | Haptic 2s, zero-auth, WhatsApp contact | 11 / 11 tests pass (0.578s) | **LULUS** |
| **Spatial Core Tests** | Haversine, snapping, konsensus, hidrolik | 27 / 27 tests pass (0.566s) | **LULUS** |
| **E2E Scenario Test** | Simulasi alur lengkap Jl. Pelita Gg. 4 | 1 / 1 scenario pass (0.098s) | **LULUS** |
| **k6 Load Testing** | Latensi p95 $< 150\text{ ms}$, konkurensi 100 req | p95 3.81 ms, 606.9 RPS | **LULUS** |
| **Usability Testing** | Skor SUS bersama 15 relawan Balakarcana | **83.17 (Grade A / Excellent)** | **LULUS** |

---

### 5. Panduan Video Demonstrasi (Durasi `04:20`)

Naskah demonstrasi taktis Jl. Pelita Gg. 4 terbagi dalam 5 segmen terukur:

- **00:00 - 00:45 | Masalah Lapangan:** Gambaran gang sempit Samarinda Ilir dan problem armada besar macet di mulut gang.
- **00:45 - 01:40 | Lapor Warga & Anti-Prank:** Dua warga melapor via Citizen PWA, lingkaran haptic 2 detik, verifikasi konsensus radius 100 m.
- **01:40 - 02:40 | Posko Induk Auto-Split:** Peta taktis posko membagi `FEEDER` di Jl. Pelita raya dan `ATTACKER` masuk Gg. 4; garis barikade fuchsia aktif.
- **02:40 - 03:40 | Mobile Volunteer Offline:** Ponsel relawan dalam mode pesawat (tanpa internet) membuka MBTiles, snapping gang, dan 1-tap minta tekanan air.
- **03:40 - 04:20 | Resolusi & Penutup:** Outbox sync saat sinyal pulih, ringkasan performa p95 3.81 ms, dan kesiapan implementasi Pemkot Samarinda.

---

### 6. Panduan Menjalankan Sistem Secara Lokal

```bash
# 1. Pastikan dependensi monorepo terpasang
pnpm install

# 2. Jalankan Backend API FastAPI
cd apps/backend-api
python -m uvicorn main:app --reload --port 8000

# 3. Jalankan Web Command Center Posko
cd ../web-command
pnpm dev --port 3000

# 4. Jalankan PWA Citizen Warga
cd ../pwa-citizen
pnpm dev --port 3001
```
