# HydraTact Samarinda

> Platform Koordinasi Taktis Operasi Pemadaman Kebakaran Permukiman Padat Berlorong Sempit (*Zero-Hardware Dependency*).

HydraTact adalah sistem terpadu lintas platform (Web Komando Posko, Aplikasi Mobile Lapangan, dan PWA Pelaporan Warga) yang dirancang untuk mengatasi kebuntuan armada, disorientasi sumber air, dan laporan palsu pada pemadaman kebakaran permukiman padat di Kota Samarinda (khususnya koridor bantaran Sungai Karang Mumus).

---

## 📌 Masalah yang Diselesaikan

1. **Traffic Gridlock di Mulut Gang ($< 2.5\text{ m}$):** Truk tangki besar saling mengunci jalur masuk, menghalangi unit lincah (tossa pompa roda tiga / portable pump).
2. **Water Logistics Blindness:** Kehabisan air tangki dan kehilangan waktu mencari hidran aktif atau dermaga pasang-surut sungai.
3. **Prank Reports & Selang Rusak:** Laporan darurat palsu serta selang pasokan air yang terlindas kendaraan karena tiadanya barikade jalan visual waktu nyata.

---

## ⚡ Fitur Utama

* **Dynamic Role Dispatching:** Klasifikasi otomatis unit `ATTACKER` (penetrasi gang) vs `FEEDER` (suplai air jalan raya) berdasarkan dimensi armada dan lebar jalan.
* **Geofencing Consensus (Anti-Prank):** Verifikasi otomatis laporan darurat warga jika terjadi konsensus $\ge 2$ laporan dalam radius $100\text{ m}$ dan durasi $\le 3\text{ menit}$.
* **Offline-First Vector Maps (.mbtiles):** Peta lorong dan gang Samarinda tetap responsif ($< 500\text{ ms}$) saat blank spot sinyal seluler di dalam gang seng rapat.
* **Outbox Pattern Mutation Queue:** Perubahan status air dan barikade selang disimpan di basis data lokal perangkat (Isar DB) dan disinkronkan otomatis saat jaringan pulih.
* **Web Command Center & FSM Lifecycle:** Pengendalian tahap operasi (`VERIFIED` $\rightarrow$ `DISPATCHING` $\rightarrow$ `SUPPRESSION_ACTIVE` $\rightarrow$ `OVERHAUL_COOLING` $\rightarrow$ `CLOSED`).

---

## 🏗️ Arsitektur & Tech Stack

Sistem dikelola dalam struktur **Monorepo** (`pnpm` + `Turborepo` + Python) berbasis kontrak **OpenAPI v3**:

* **Web Command Center & Citizen PWA:** Next.js 14, TypeScript, Tailwind CSS, Leaflet.js
* **Field Mobile App:** Flutter 3.x (Android), Isar DB, `flutter_map_mbtiles`, `supabase_flutter`
* **Backend & Spatial Core:** Python 3.11+, FastAPI, Pydantic v2, Shapely, GeoAlchemy2
* **BaaS & Spatial Persistence:** Supabase (PostgreSQL 15/16 + PostGIS SRID 4326, Supabase Realtime CDC, Supabase Auth)
* **Data Spasial Lapangan:** OpenStreetMap Samarinda road networks + DEM Badan Informasi Geospasial + Tippecanoe `.mbtiles`

---

## 📁 Struktur Repositori

```text
HydraTact/
├── .agents/             # Rule dan workflow agen AI proyek
├── apps/
│   ├── backend-api/     # FastAPI Python 3.11+ Core Spasial & REST API
│   ├── web-command/     # Next.js 14 Dasbor Komando Posko
│   ├── pwa-citizen/     # Next.js 14 PWA Lapor Warga
│   └── mobile-volunteer/# Flutter Android Lapangan
├── supabase/            # Migrasi DDL PostGIS, RLS, & Seeding Supabase
├── docs/                # Dokumentasi PRD, Arsitektur, Basis Data, & Kontrak API
├── Proposal KMM/        # Berkas proposal dan panduan kompetisi AST-PTMA
├── .gitattributes       # Normalisasi line-ending lintas platform
├── .gitignore           # Konfigurasi ignore komprehensif monorepo
├── CONTRIBUTING.md      # Panduan branch, commit, dan alur PR
├── TASK.md              # Peta tugas 4 hari eksekusi intensif
└── README.md
```

---

## 👥 Tim Pengembang

**Program Studi Teknik Informatika — Universitas Muhammadiyah Kalimantan Timur (UMKT)**
* **Hervino Islami Fasha** — *Lead Architect & Fullstack*
* **Ilham Ramadhani** — *Data & Spatial Backend*
* **Ariyadi** — *UI/UX & Mobile Engineer*
