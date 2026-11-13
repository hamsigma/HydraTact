# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Nama Produk:** HydraTact Samarinda  
**Versi Dokumen:** 1.0 (MVP & Arsitektur Kompetisi KMM AST-PTMA 2026)  
**Status:** Disetujui untuk Pengembangan Purwarupa  
**Tim Pengembang:** Hervino Islami Fasha (Lead Architect & Fullstack), Ilham Ramadhani (Data & Spatial Backend), Ariyadi (UI/UX & Mobile Engineer)  
**Institusi:** Program Studi Teknik Informatika, Universitas Muhammadiyah Kalimantan Timur (UMKT)

---

## 1. Ringkasan Eksekutif & Latar Belakang Masalah

### 1.1 Definisi Produk
**HydraTact** adalah platform koordinasi taktis lintas perangkat (Web Command Center, Aplikasi Mobile Lapangan, dan PWA Pelaporan Warga) yang dirancang untuk mengoptimalkan operasi pemadaman kebakaran di kawasan permukiman padat berlorong sempit di Kota Samarinda. Sistem ini bekerja murni berbasis perangkat lunak tanpa ketergantungan pada perangkat keras sensor IoT tambahan (*Zero-Hardware Dependency*).

### 1.2 Pernyataan Masalah (*Problem Statement*)
Berdasarkan data operasional kebakaran permukiman di Kota Samarinda (48--55 kejadian per tahun di wilayah padat seperti Kel. Pelita, Sidodadi, Damanhuri, dan Karang Asam), respons awal puluhan posko relawan swadaya (Balakarcana/PMK) tergolong sangat cepat (3--7 menit). Namun, koordinasi konvensional melalui grup WhatsApp dan radio Handy Talky (HT) memicu tiga kegagalan operasional utama:

1. **Kebuntuan Ruang Gerak Armada (*Traffic Gridlock*):** Truk tangki besar (3.000--5.000 liter) dari berbagai posko meluncur bersamaan dan saling mengunci di mulut gang selebar $< 2,5\text{ meter}$, menutup jalur bagi unit kecil (tossa pompa roda tiga atau pompa jinjing) yang seharusnya masuk mendekati titik api.
2. **Disorientasi Pasokan Air (*Water Logistics Blindness*):** Muatan air tangki habis dalam 8--12 menit penyemprotan. Awak armada kehilangan waktu rata-rata 18 menit berkeliling mencari pasokan air karena tidak ada pemetaan status operasional hidran PDAM, tandon warga, maupun elevasi pasang-surut Sungai Karang Mumus.
3. **Kerentanan Laporan Palsu (*Prank Reports*) & Kerusakan Selang:** Ketiadaan verifikasi koordinat otomatis membuat armada rentan merespons alamat fiktif, sementara bentangan selang air di jalan raya sering terlindas kendaraan umum karena tidak ada penandaan barikade jalan secara waktu nyata.

---

## 2. Target Pengguna (*User Personas*)

| Persona | Peran Sistem | Platform | Karakteristik & Kondisi Lingkungan | Kebutuhan Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Warga Sekitar Lokasi** | `CITIZEN` (Pelapor) | Mobile Web (PWA Tanpa Login) | Panik, tergesa-gesa, mungkin berada di area berasap atau sinyal seluler lemah. | Melaporkan titik api dalam hitungan detik tanpa registrasi akun atau mengetik alamat manual. |
| **Operator Posko Induk** | `COMMANDER` (Pengendali) | Web Desktop / Tablet | Berada di ruang posko/mobil komando, memantau puluhan unit relawan sekaligus. | Melihat gambaran menyeluruh lokasi api, lebar gang, pembagian peran armada, dan status pasokan air. |
| **Sopir Truk Tangki** | `VOLUNTEER_FEEDER` | Android App (Flutter) | Mengemudikan truk besar ($\ge 3.000\text{ L}$), memakai sarung tangan, butuh keputusan cepat di jalan arteri. | Mengetahui titik berhenti yang aman di luar gang dan rute tercepat menuju hidran/tandon aktif terdekat. |
| **Regu Serbu Lorong** | `VOLUNTEER_ATTACKER` | Android App (Flutter) | Mengoperasikan motor roda tiga/pompa jinjing di dalam gang sempit, tangan basah, sinyal seluler sering hilang (*blank spot*). | Panduan jarak menuju titik api, peta lorong yang tetap terbuka tanpa internet, dan tombol minta tekanan air. |

---

## 3. Tujuan Produk & Metrik Keberhasilan (*Success Metrics*)

| Kategori Metrik | Indikator Kinerja | Kondisi Awal (*Baseline*) | Target HydraTact | Metode Pengukuran |
| :--- | :--- | :--- | :--- | :--- |
| **Efisiensi Logistik Air** | Waktu pencarian sumber air isi ulang terdekat | ~18 menit | $< 8\text{ menit}$ | Simulasi rute navigasi pada skenario uji lapangan |
| **Kelancaran Akses Gang** | Insiden truk tangki saling mengunci di mulut gang $< 2,5\text{ m}$ | Sering terjadi | $0$ (*Zero Traffic Lock*) | Validasi logika *Auto-Split Role Dispatching* |
| **Keandalan Luring** | Waktu muat peta vektor lingkungan saat sinyal 0 bar | Gagal dimuat (*blank*) | $< 500\text{ ms}$ | Pengujian *Airplane Mode* pada perangkat Android |
| **Kinerja Sistem** | Latensi kalkulasi peran & kueri spasial PostGIS | Tidak terukur | $< 150\text{ ms}$ (p95) | *Load testing* 100 permintaan konkuren |
| **Kemudahan Pakai** | Skor *System Usability Scale* (SUS) oleh relawan | Tidak tersedia | $\ge 75$ (Kategori *Good*) | Uji coba 5 skenario kritis dengan 15 responden relawan |

---

## 4. Ruang Lingkup Produk (*Scope*)

### 4.1 Termasuk dalam Ruang Lingkup (*In-Scope*)
* Portal PWA pelaporan darurat warga dengan kunci GPS otomatis dan tombol tahan 2 detik (*haptic hold*).
* Mesin konsensus spasial (*geofencing*) untuk menyaring laporan palsu secara otomatis.
* Dasbor Komando Web berbasis peta gelap kontras tinggi dengan lapisan kontur, sungai, hidran, tandon, dan jalur selang.
* Algoritma pembagian peran armada otomatis (*Dynamic Role Dispatching*: `ATTACKER` vs `FEEDER`).
* Aplikasi mobile Android untuk relawan dengan peta vektor lokal terkompresi (`.mbtiles`) dan antrean sinkronisasi lokal (*Outbox Pattern*).
* Manajemen siklus hidup insiden berbasis *Finite State Machine* (FSM).

### 4.2 Di Luar Ruang Lingkup (*Out-of-Scope*)
* Pemasangan sensor perangkat keras fisik (sensor tekanan air, pelacak GPS khusus kendaraan, atau mikrokontroler IoT) pada hidran maupun truk relawan.
* Integrasi langsung dengan sistem panggilan darurat nasional 112 atau infrastruktur perbankan/pembayaran.
* Pemetaan detail gang sempit di luar wilayah administrasi Kota Samarinda pada rilis MVP.

---

## 5. Persyaratan Fungsional (*Functional Requirements*)

### Epic 1: Pelaporan Darurat Warga & Konsensus Anti-Prank
* **FR-01 — Pelaporan Cepat Tanpa Login (*Zero-Auth Emergency Trigger*):**
  * Sistem menyediakan halaman web ringan (PWA) yang langsung meminta izin geolokasi perangkat saat dibuka.
  * Pelapor wajib menekan dan menahan tombol darurat selama $2,0\text{ detik}$ (*press-and-hold*) sebelum muatan laporan dikirim ke peladen, guna mencegah pelaporan akibat sentuhan tidak sengaja.
  * Muatan laporan mencakup koordinat `(latitude, longitude)`, akurasi GPS dalam meter, stempel waktu klien, dan nomor telepon/WhatsApp pelapor.
* **FR-02 — Mesin Konsensus Spasial (*Geofencing Consensus*):**
  * Sistem mengevaluasi setiap laporan baru terhadap laporan aktif lain dalam radius spasial $r \le 100\text{ meter}$ dan rentang waktu $\Delta t \le 3\text{ menit}$.
  * Jika ditemukan $\ge 2$ laporan unik dalam klaster tersebut, status insiden otomatis berubah dari `PENDING_VERIFICATION` menjadi `VERIFIED` dan memicu alarm ke seluruh posko tanpa menunggu panggilan telepon verifikasi manual.

### Epic 2: Mesin Alokasi Peran Armada (*Dynamic Role Dispatching*)
* **FR-03 — Penetapan Peran Otomatis Berdasarkan Dimensi & Kapasitas:**
  * Sistem membaca atribut lebar jalan masuk lingkungan ($W_{\text{road}}$) dari data spasial jalan atau input operator, serta kapasitas tangki air armada ($C(U_i)$).
  * Aturan keputusan deterministik:
    $$\text{Role}(U_i) = \begin{cases} \text{FEEDER}, & \text{jika } W_{\text{road}} < 2,5\text{ m} \;\land\; C(U_i) \ge 3.000\text{ L} \\ \text{ATTACKER}, & \text{jika } W_{\text{road}} < 2,5\text{ m} \;\land\; C(U_i) < 1.000\text{ L} \\ \text{RESERVE\_FEEDER}, & \text{jika } W_{\text{road}} < 2,5\text{ m} \;\land\; 1.000\text{ L} \le C(U_i) < 3.000\text{ L} \\ \text{DIRECT\_ATTACK}, & \text{jika } W_{\text{road}} \ge 2,5\text{ m} \end{cases}$$

### Epic 3: Dasbor Komando Web & Siklus Hidup Insiden (FSM)
* **FR-04 — Kanvas Spasial Taktis Waktu Nyata:**
  * Menampilkan peta interaktif Kota Samarinda dengan informasi ketinggian pasang-surut Sungai Karang Mumus, lokasi titik api, pergerakan unit `ATTACKER` dan `FEEDER`, titik sumber air, serta garis barikade selang.
  * Menyediakan log mutasi lapangan secara kronologis (*telemetry stream*).
* **FR-05 — Pengendalian Tahap Operasi (*Finite State Machine*):**
  * Operator posko dapat memindahkan status insiden secara berurutan: `VERIFIED` $\rightarrow$ `DISPATCHING` $\rightarrow$ `SUPPRESSION_ACTIVE` $\rightarrow$ `OVERHAUL_COOLING` (tahap pendinginan bara) $\rightarrow$ `INCIDENT_CLOSED` $\rightarrow$ `ARCHIVED`.

### Epic 4: Manajemen Logistik Air & Barikade Selang
* **FR-06 — Pencarian Sumber Air Terdekat (*Haversine Sorting*):**
  * Aplikasi lapangan menghitung jarak dari posisi armada ke seluruh titik sumber air (`PDAM_HYDRANT`, `COMMUNITY_TOWER`, `RIVER_TIDAL_DOCK`) menggunakan rumus Haversine:
    $$d = 2R \cdot \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$
  * Menyaring titik berstatus `EMPTY` atau `DAMAGED`, lalu menampilkan 3 titik terdekat beserta estimasi waktu tempuh.
* **FR-07 — Pembaruan Status Debit Air Satu Ketukan (*1-Tap Water Status*):**
  * Relawan dapat mengubah status titik air menjadi **`READY`** (Siap Pakai / Debit Deras), **`LOW_DISCHARGE`** (Debit Rendah / Perlu Pompa Hisap), atau **`EMPTY`** (Kering / Rusak). Perubahan ini langsung menyebar ke peta unit lain.
* **FR-08 — Penandaan Barikade Selang Jalan (*Hose Barricade*):**
  * Awak unit `FEEDER` atau `ATTACKER` dapat mengaktifkan sakelar barikade jalan pada ruas jalan yang dilintasi selang suplai air bertekanan. Sistem menggambar garis geometri `LineString` berwarna fuchsia pada peta untuk mengalihkan lalu lintas armada lain dan mencegah selang terlindas.

### Epic 5: Mesin Peta Luring & Sinkronisasi Outbox
* **FR-09 — Rendering Peta Vektor Luring (*Offline-First MBTiles*):**
  * Aplikasi mobile menyematkan berkas peta vektor lokal `.mbtiles` wilayah Kota Samarinda (tingkat pembesaran *zoom level* 14--18, ukuran terkompresi $\le 45\text{ MB}$). Seluruh jaringan jalan lingkungan dan gang tetap dapat digeser dan diperbesar tanpa sambungan internet.
* **FR-10 — Antrean Sinkronisasi Mutasi Lokal (*Outbox Pattern*):**
  * Ketika perangkat kehilangan sinyal seluler, setiap perubahan status air, penandaan barikade, atau konfirmasi posisi tetap langsung diterapkan pada tampilan (*Optimistic UI*) dan disimpan ke tabel antrean lokal `sync_queue` di basis data perangkat (Isar DB) dengan tanda `is_synced = false`.
  * Begitu konektivitas internet kembali terdeteksi, pekerja latar belakang (*background worker*) mengirimkan seluruh antrean secara berurutan (FIFO) ke peladen API.

---

## 6. Persyaratan Non-Fungsional (*Non-Functional Requirements*)

1. **Ergonomi Kondisi Darurat (*High-Stress UI Ergonomics*):**
   * Antarmuka menggunakan latar gelap (*dark mode*, `#07090E` hingga `#141923`) dengan rasio kontras teks minimal $7:1$ (standar aksesibilitas WCAG AAA) agar tetap terbaca jelas di tengah kepulan asap atau cahaya terik matahari.
   * Seluruh tombol interaksi utama pada aplikasi mobile memiliki ukuran area sentuh minimal $48 \times 48\text{ dp}$ (dan $56\text{--}64\text{ dp}$ untuk aksi kritis) guna mendukung pengoperasian dengan tangan basah atau bersarung tangan pemadam.
   * Angka metrik (jarak meter, lebar gang, kapasitas tangki, pewaktu durasi) wajib menggunakan tipografi *monospace* berlebar tetap (`tabular-nums`) agar angka tidak bergeser saat berubah.
2. **Keandalan & Konsistensi Data:**
   * Setiap entri antrean *Outbox* dilengkapi kunci idempotensi (`mutation_uuid`) dan stempel waktu perangkat (`client_timestamp`) sehingga pengiriman ulang akibat koneksi tidak stabil tidak akan menggandakan data di peladen.
3. **Portabilitas Arsitektur & Realtime BaaS:**
   * Seluruh kode sumber dikelola dalam struktur **Monorepo** dengan backend spasial berbasis **FastAPI (Python 3.11+)** dan platform **Supabase (PostgreSQL 15/16 + PostGIS + Supabase Realtime CDC)**, serta kontrak pertukaran data terpusat menggunakan spesifikasi **OpenAPI v3** (dihasilkan otomatis dari model Pydantic v2 FastAPI).

---

## 7. Spesifikasi Model Data & Kontrak API Utama

### 7.1 Entitas Basis Data Spasial (PostgreSQL + PostGIS SRID 4326)
* **`incidents`:** `id (UUID)`, `reporter_phone`, `geom (Point)`, `street_address`, `road_width_meters (Numeric)`, `status (Enum)`, `reported_at`, `verified_at`, `closed_at`.
* **`incident_units`:** `id (UUID)`, `incident_id (FK)`, `unit_identifier`, `vehicle_type`, `water_capacity_liters (Int)`, `assigned_role (Enum)`, `current_geom (Point)`, `updated_at`.
* **`water_sources`:** `id (UUID)`, `name`, `source_type (Enum)`, `geom (Point)`, `capacity_liters (Int)`, `status (Enum)`, `last_verified_at`.
* **`road_barricades`:** `id (UUID)`, `incident_id (FK)`, `road_name`, `geom (LineString)`, `reason (Enum)`, `is_active (Boolean)`, `created_at`.
* **`sync_queue` (Lokal Perangkat Mobile):** `local_id (Int)`, `mutation_uuid (String)`, `endpoint (String)`, `payload (JSON)`, `client_timestamp (DateTime)`, `is_synced (Boolean)`, `retry_count (Int)`.

### 7.2 Titik Akhir API Utama (*Core Endpoints*)
* `POST /api/v1/incidents/report` — Menerima laporan darurat warga dan menjalankan evaluasi konsensus radius $100\text{ m}$.
* `PATCH /api/v1/incidents/{id}/transition` — Memindahkan status FSM insiden dan memicu kalkulasi ulang *Dynamic Role Dispatching*.
* `GET /api/v1/water-sources/nearest?lat={lat}&lng={lng}&limit=3` — Mengembalikan 3 sumber air aktif terdekat menggunakan indeks spasial GIST.
* `POST /api/v1/sync/outbox-batch` — Menerima larik mutasi luring dari perangkat relawan secara atomik dalam satu transaksi basis data.

---

## 8. Audit Asumsi Kritis & Penanganan Kondisi Batas (*Edge Cases*)

Untuk memastikan ketangguhan sistem di lapangan nyata dan saat pengujian oleh dewan juri, empat skenario kegagalan berikut telah diidentifikasi beserta solusinya:

| Skenario Kritis / Asumsi | Dampak Jika Diabaikan | Solusi Mitigasi Arsitektur |
| :--- | :--- | :--- |
| **1. Kebakaran terjadi tengah malam saat warga tertidur** | Hanya ada 1 pelapor tunggal; syarat konsensus $\ge 2$ laporan dalam 3 menit tidak terpenuhi sehingga status tertahan di `PENDING`. | Operator posko memiliki tombol **Manual Override (`Verifikasi Paksa`)** disertai panggilan balik cepat 1-klik ke nomor pelapor agar insiden tetap dapat segera diberangkatkan. |
| **2. Penyimpangan sinyal GPS (*GPS Multipath Drift*) di gang sempit beratap seng** | Titik posisi unit `ATTACKER` melompat 15--30 meter ke gang sebelah pada peta. | Mengaktifkan *Map-Matching Snapping* di sisi klien: koordinat GPS mentah dikunci (*snap*) ke garis jaringan jalan lingkungan terdekat pada berkas `.mbtiles` jika jarak deviasi $< 25\text{ meter}$. |
| **3. Konflik pembaruan status hidran oleh dua regu saat sama-sama *offline*** | Regu A menandai hidran `EMPTY` pukul 20:10, Regu B menandai `READY` pukul 20:12; data yang masuk belakangan ke server bisa menimpa fakta terbaru. | Peladen membandingkan nilai `client_timestamp` dari masing-masing muatan *Outbox* (*Last-Write-Wins based on Client Event Time*), bukan waktu kedatangan paket di server. |
| **4. Kegagalan sinkronisasi penuh akibat perangkat kehabisan baterai** | Data mutasi tersimpan di ponsel yang mati sebelum sempat terhubung ke internet. | Penyimpanan Isar DB bersifat persisten di memori non-volatil ponsel; begitu perangkat dinyalakan kembali dan mendapat sinyal, pekerja latar belakang otomatis melanjutkan pengiriman antrean yang tertunda. |

---

## 9. Peta Jalan Pengembangan (*Implementation Roadmap*)

1. **Fase 1 — Fondasi Data & Kontrak (Sprint 1):**
   * Ekstraksi jaringan jalan lingkungan Samarinda dari OpenStreetMap dan pembuatan berkas `samarinda_dense.mbtiles`.
   * Penyusunan skema SQL PostGIS 3NF, data awal (*seeding*) 30 titik hidran/tandon Samarinda, dan spesifikasi OpenAPI v3.
2. **Fase 2 — Mesin Inti & Dasbor Komando (Sprint 2):**
   * Implementasi algoritma *Dynamic Role Dispatching*, konsensus radius $100\text{ m}$, dan mesin status FSM pada peladen API.
   * Pengembangan Dasbor Komando Web (Next.js + Tailwind CSS + Leaflet.js).
3. **Fase 3 — Klien Bergerak & Ketahanan Luring (Sprint 3):**
   * Pengembangan aplikasi Flutter untuk mode `ATTACKER` dan `FEEDER`.
   * Integrasi pembaca peta luring `flutter_map_mbtiles` dan antrean mutasi lokal Isar DB (*Outbox Sync*).
   * Pengembangan halaman PWA Pelaporan Darurat Warga.
4. **Fase 4 — Pengujian Terpadu & Evaluasi Lapangan (Sprint 4):**
   * Pengujian unit pada fungsi pembagian peran dan rumus jarak Haversine (target cakupan kode $\ge 80\%$).
   * Simulasi pemutusan jaringan (*Airplane Mode Stress Test*) dan pengujian kegunaan (*System Usability Scale*) bersama perwakilan relawan pemadam kebakaran Samarinda.