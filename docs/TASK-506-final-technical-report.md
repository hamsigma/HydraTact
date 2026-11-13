# LAPORAN TEKNIS AKHIR (FINAL TECHNICAL REPORT)
## HYDRATACT SAMARINDA: PLATFORM TAKTIS PENANGGULANGAN KEBAKARAN GANG SEMPIT BERBASIS PETA LURING & KOORDINASI ARMADA RELAWAN SWADAYA

**Kategori Kompetisi:** Kompetisi Mahasiswa Muhammadiyah (KMM) AST-PTMA 2026  
**Bidang Lomba:** Inovasi Teknologi Informasi & Komputasi Darurat Bencana  
**Afiliasi Institusi:** Universitas Muhammadiyah Kalimantan Timur (UMKT)  
**Tim Pengembang:**
- **Ariyadi (`@Ariyadi`)** — *UI/UX & Mobile Engineer* (Flutter, Isar DB, Tactical Ergonomics)
- **Hervino (`@Hervino`)** — *Full-Stack Web & PWA Engineer* (FastAPI, Web Command, Citizen PWA)
- **Ilham (`@Ilham`)** — *Spatial Systems & Infrastructure Engineer* (PostGIS, Map-Matching, MBTiles Pipeline)

---

## 1. Eksekutif Ringkasan (Executive Summary)
Kota Samarinda mencatat frekuensi kebakaran permukiman tertinggi di Kalimantan Timur (48–55 kejadian per tahun), dengan konsentrasi risiko terbesar di kawasan permukiman kayu padat bantaran sungai seperti Jl. Pelita, Sidodadi, dan Karang Mumus. Meskipun respon awal puluhan posko relawan swadaya (Balakarcana/PMK) sangat cepat (3–7 menit), penanganan sering kali gagal karena:
1. Kemacetan total di gang sempit akibat truk tangki besar (5.000L) memaksa masuk ke lorong $< 2.5\text{ m}$.
2. Pemborosan armada akibat maraknya laporan palsu (*prank call*) di media sosial.
3. Terputusnya koordinasi karena *dead-zone* sinyal seluler di dalam kawasan permukiman padat.

**HydraTact** memecahkan seluruh masalah tersebut dengan prinsip **Zero-Hardware Dependency** (tanpa sensor IoT mahal), memadukan:
- **Pelaporan Warga Anti-Prank:** Tombol darurat *Haptic Press-and-Hold* 2.0 detik via PWA dan verifikasi otomatis konsensus geofencing radius $100\text{ m}$.
- **Peta Vektor Luring Instan:** Rendering lokal berkas `.mbtiles` pada aplikasi Android relawan dalam waktu $< 100\text{ ms}$ tanpa internet.
- **Dynamic Role Dispatching:** Pembagian peran adaptif antara unit serbu kecil (**ATTACKER**) dan truk tangki arteri (**FEEDER**) yang terkunci di jalan lebar $\ge 6\text{ m}$ serta sakelar barikade selang.
- **Offline-First Outbox Pattern:** Sinkronisasi mutasi deterministik berbasis Isar Database 3.1 dengan jaminan *Zero Data Loss* dan aturan *Last-Write-Wins*.

---

## 2. Inovasi & Nilai Kebaruan

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARSITEKTUR LENGKAP HYDRATACT                          │
└─────────────────────────────────────────────────────────────────────────────┘
  [ Citizen PWA ]          [ Mobile Volunteer ]          [ Web Command ]
  • Press-and-Hold 2.0s    • MBTiles Vector Map          • Spatiotemporal Live
  • Haptic Feedback        • Isar DB Outbox Worker       • Consensus Monitor
  • Geofence Report        • Glove-Friendly 1-Tap UI     • Water Logistics
         │                         │                            │
         ▼                         ▼                            ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                   FASTAPI BACKEND & SPATIAL ENGINE                      │
  │ • Geofencing Consensus Engine (100m Radius, 3min Window, Min 2 Reports) │
  │ • Dynamic Role Dispatcher (Width Threshold: 6m / Artery vs Gang Sempit) │
  │ • Outbox Batch Sync API (FIFO, Last-Write-Wins Conflict Resolution)     │
  └─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                      [ Supabase PostGIS 15+ ]
```

### 2.1 Ergonomi Taktis Tanpa Kompromi (Design.md)
- **Tema Gelap Kontras Ekstrem (OLED Dark `#07090E`):** Memenuhi standar WCAG AAA kontras $\ge 7:1$ untuk keterbacaan di bawah sinar matahari tropis maupun di tengah asap pekat.
- **Target Sentuh Ramah Sarung Tangan ($\ge 48\text{ dp}$):** Seluruh tombol taktis kritis berukuran 52–64 dp.
- **Larangan Mutlak Pill Chips (*Strict Ban on Pill Badges*):** Menolak elemen UI generik membulat (`rounded-full`) demi menjaga hirarki visual profesional dan fokus kognitif relawan.
- **Tipografi Tabular Numerals:** Angka tekanan pompa (`5.0 BAR`) dan volume tangki (`4200 L`) menggunakan font monospace agar tidak melompat-lompat saat data berubah dinamis.

---

## 3. Matriks Hasil Pengujian & Verifikasi Kinerja

| Parameter Kinerja | Target PRD | Hasil Aktual Pengujian | Status | Bukti Verifikasi |
| :--- | :---: | :---: | :---: | :--- |
| **Latensi Render Peta Luring** | $< 500\text{ ms}$ | **$68\text{ ms}$** | `TERPENUHI` | `mbtiles_render_test.dart` (5/5 Pass) |
| **Latensi Mutasi Optimistik Lokal** | $< 100\text{ ms}$ | **$< 20\text{ ms}$** | `TERPENUHI` | `outbox_worker_test.dart` (4/4 Pass) |
| **Kehilangan Data saat Luring (Stress)** | $0.0\%$ | **$0.0\%$ (Zero Data Loss)** | `TERPENUHI` | `airplane_mode_stress_test.dart` (10/10 Pass) |
| **Skor System Usability Scale (SUS)** | $\ge 75.0$ | **$83.17 / 100$ (Grade A-)** | `TERPENUHI` | 15 Responden Relawan Balakarcana |
| **Target Sentuh Sarung Tangan** | $\ge 48\text{ dp}$ | **$52\text{ dp} - 64\text{ dp}$** | `TERPENUHI` | `water_barricade_actions_test.dart` (4/4 Pass) |
| **Pencegahan Laporan Prank Warga** | $2.0\text{ detik}$ | **Tepat $2.000\text{ ms}$** | `TERPENUHI` | `HapticPressAndHoldButton.test.ts` (3/3 Pass) |

---

## 4. Struktur Repositori Monorepo
```text
HydraTact/
├── apps/
│   ├── backend-api/          # FastAPI, GeoAlchemy2, Outbox Sync Service
│   ├── mobile-volunteer/      # Flutter 3.x Android, MBTiles, Isar DB 3.1
│   ├── pwa-citizen/           # Next.js 14, Haptic Press-and-Hold Button
│   └── web-command/           # Next.js 14, Posko Command Dashboard
├── docs/                      # Dokumentasi Teknis (PRD, Arsitektur, Desain, SOP)
│   ├── test/                  # Laporan Uji Coba Luring & Stres
│   ├── TASK-504-sus-evaluation-report.md
│   ├── TASK-505-video-demo-guide.md
│   └── TASK-506-final-technical-report.md
├── packages/
│   └── spatial-core/          # Library Geospasial Bersama (Haversine & Snapping)
└── TASK.md                    # Matriks Status Seluruh 25 Tugas Tim
```

---

## 5. Panduan Menjalankan Sistem (*Quick Start*)

### 5.1 Menjalankan Aplikasi Mobile Relawan (Flutter)
```powershell
cd apps/mobile-volunteer
flutter pub get
flutter test
flutter run
```

### 5.2 Menjalankan Citizen PWA (Web)
```powershell
cd apps/pwa-citizen
pnpm test
pnpm dev
```

### 5.3 Menjalankan Backend API
```powershell
cd apps/backend-api
python -m pytest
uvicorn app.main:app --reload --port 8000
```

---

## 6. Kesimpulan & Penutup
HydraTact Samarinda membuktikan bahwa tantangan darurat bencana perkotaan pada permukiman padat dapat diselesaikan secara elegan tanpa infrastruktur sensor fisik yang mahal. Melalui perpaduan algoritma spasial cerdas, ergonomi antarmuka taktis berbasis kearifan lokal, dan arsitektur luring yang tangguh, HydraTact siap bertransformasi dari prototipe kompetisi menjadi standar operasional pemadam kebakaran swadaya di seluruh Indonesia.
