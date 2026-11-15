# SISTEM DESAIN & ERGONOMI TAKTIS (TACTICAL DESIGN SYSTEM SPECIFICATION)

**Nama Produk:** HydraTact Samarinda  
**Versi Dokumen:** 2.0.0 (Standar Kompetisi KMM AST-PTMA 2026)  
**Metodologi Terpadu:** Apple Human Interface Guidelines (Apple HIG OS 27), Impeccable (Operate Mode & Craft Floor), UI/UX Pro Max (Design Intelligence)  
**Lingkup Antarmuka:** Web Command Center (`apps/web-command`), Citizen Emergency PWA (`apps/pwa-citizen`), Mobile Volunteer App (`apps/mobile-volunteer`)  
**Tujuan Desain:** Menjamin kecepatan respons, kejelasan informasi tanpa beban kognitif (*Zero Cognitive Overhead*), dan kemudahan operasi fisik ekstrem saat menangani kebakaran permukiman padat dan gang sempit Kota Samarinda.

---

## 1. Filosofi & Prinsip Desain Kondisi Stres Tinggi (High-Stress Design Principles)

Antarmuka HydraTact dioperasikan dalam lingkungan darurat kritis: kepulan asap pekat, getaran kendaraan pemadam, pantulan sinar matahari terik tepian sungai atau gelap gulita saat listrik padam, serta personel yang menggunakan sarung tangan tebal dan basah.

Sesuai panduan **Apple HIG** dan **Impeccable (Mode Operate)**, sistem dibangun di atas 4 pilar utama:

1. **Prioritas Kontras Mutlak (WCAG 2.1 AAA $\ge 7:1$):**  
   Seluruh elemen teks, simbol, dan batas interaksi wajib memenuhi rasio kontras minimal 7:1 terhadap latar belakang. Pada latar kanvas utama (`#07090E`), rasio kontras teks utama mencapai **15.8:1** (Text Primary `#F0F6FC`) dan **7.2:1** (Text Secondary `#8B949E`).
2. **Target Sentuh Ramah Sarung Tangan (Glove-Friendly Touch Targets):**  
   Mengikuti standar Apple HIG untuk kontrol kritis:
   * Target sentuh umum minimal: **$44 \times 44\text{ pt}$** (iOS) / **$48 \times 48\text{ dp}$** (Android / Web).
   * Aksi taktis darurat langsung: tinggi **$52\text{ dp}$ hingga $64\text{ dp}$** dengan lebar penuh (*full-width block*).
3. **Kestabilan Tipografi Numerik (Tabular Numerals):**  
   Seluruh angka telemetri yang terus diperbarui (jarak meter ke api, tekanan pompa Bar, kapasitas tangki air, durasi detik) wajib menggunakan atribut CSS `font-variant-numeric: tabular-nums` pada font monospaced untuk mencegah pergeseran tata letak (*zero cumulative layout shift* / CLS < 0.05).
4. **Bebas Distraksi & Efisiensi Tugas (Operate Mode):**  
   Dilarang menggunakan efek gradien kosmetik, animasi dekoratif tanpa makna, bayangan mengambang berlebih (*ghost cards*), atau kartu bertumpuk (*nested cards*). Setiap piksel didedikasikan untuk kecepatan pembacaan situasi (*situational awareness*).

---

## 2. Larangan Mutlak Elemen Antarmuka (Impeccable Craft Floor & Banned Elements)

Sesuai aturan `no-pill-chips.md` dan standar mutu *Impeccable Craft Floor*, elemen-elemen berikut **DILARANG KERAS** muncul di seluruh platform:

### 2.1 Larangan Mutlak (Strict Bans)
* **Pill Chips / Oval Badges:** Dilarang membungkus teks status, kategori, atau catatan ke dalam kontainer kapsul membulat penuh (`rounded-full` dengan padding lonjong `px-3 py-1`, border tipis, dan latar transparan).
* **Dot Indikator Dekoratif:** Dilarang meletakkan dot kecil berkedip (`w-2 h-2 rounded-full animate-pulse`) di dalam kapsul status.
* **Badge Mengambang di Atas Judul:** Dilarang meletakkan chip atau badge mengambang di atas judul utama (H1) atau hero header.
* **Ghost Cards / Kartu Bertumpuk:** Dilarang membuat kartu di dalam kartu (*cards-inside-cards*) atau kartu dengan bayangan lembut yang mengaburkan batas konten.
* **Emoji sebagai Ikon:** Dilarang menggunakan emoji Unicode sebagai ikon navigasi/status; wajib menggunakan ikon vektor monoline SVG terstandarisasi.

### 2.2 Standar Pengganti (Minimalist Plain-Text Standard)
1. **Section Eyebrow & Kategori:**  
   Gunakan tipografi teks murni tanpa latar belakang, tanpa border, dan tanpa dot:
   ```css
   font-family: monospace;
   font-size: 11px;
   font-weight: 700;
   letter-spacing: 0.15em;
   text-transform: uppercase;
   color: #8B949E;
   margin-bottom: 8px;
   ```
2. **Judul Utama (H1):**  
   Judul berdiri sendiri secara gagah dan bersih di puncak hierarki visual.
3. **Status Operasional & Metrik:**  
   Tampilkan status sebagai teks tebal langsung dengan font monospace:
   ```css
   font-family: monospace;
   font-size: 12px;
   font-weight: 700;
   color: #10B981; /* Hijau Emerald untuk READY / VERIFIED */
   ```
4. **Catatan & Peringatan:**  
   Gunakan blok datar berbatas garis 1 px di sisi kiri (`border-l-2 border-stone-700 pl-3`), bukan chip mengambang.

---

## 3. Sistem Token Warna Taktis (Tactical OLED Dark System)

Palet warna menggunakan fondasi hitam OLED pekat untuk memaksimalkan efisiensi baterai ponsel relawan di lapangan dan memastikan visibilitas tinggi di bawah cahaya matahari terik maupun kondisi gelap pekat.

### 3.1 Hierarki Permukaan (Surface Hierarchy)

```css
:root {
  /* Surface Layers */
  --color-surface-0: #07090E; /* Base Canvas: Latar belakang utama seluruh aplikasi */
  --color-surface-1: #0D1117; /* Card Surface: Permukaan panel data & lembar kontrol */
  --color-surface-2: #161B22; /* Overlay Surface: Dialog konfirmasi & modal taktis */
  
  /* Borders */
  --color-border-subtle: #21262D; /* Garis pembatas 1 px antar panel */
  --color-border-active: #30363D; /* Garis pembatas panel yang sedang aktif */

  /* Text & Foreground */
  --color-text-primary: #F0F6FC;   /* Kontras 15.8:1 terhadap surface-0 (WCAG AAA) */
  --color-text-secondary: #8B949E; /* Kontras 7.2:1 terhadap surface-0 (WCAG AAA) */
  --color-text-muted: #484F58;     /* Teks keterangan non-interaktif */

  /* Peran Taktis Lapangan */
  --color-attacker: #EF4444;       /* Merah pekat: Unit serbu gang sempit & tombol darurat */
  --color-feeder: #F59E0B;         /* Amber reflektif: Unit tangki pengumpan jalan arteri */
  --color-commander: #38BDF8;      /* Sky Cyan: Posko komando, fokus peta & Sungai Karang Mumus */
  --color-barricade: #D946EF;      /* Fuchsia neon: Garis barikade selang (kontras tertinggi) */

  /* Status Sumber Air & Hidran */
  --color-water-ready: #10B981;        /* Hijau Emerald: Debit air lancar (>= 4.0 Bar) */
  --color-water-low: #F59E0B;          /* Amber peringatan: Debit rendah (< 2.0 Bar) */
  --color-water-empty: #64748B;        /* Slate redup: Tandon kering / hidran kosong */
  --color-water-damaged: #DC2626;      /* Merah padam: Fisik hidran patah / rusak */
}
```

---

## 4. Tipografi & Skala Hierarki Data

Sistem tipografi memadukan font sans-serif netral untuk instruksi umum dan font monospaced untuk seluruh data telemetri.

### 4.1 Pemilihan Keluarga Font
* **Display & Body:** `Inter`, `Roboto`, atau `System Sans-Serif`.
* **Data Telemetri, Kode Unit & Metrik:** `JetBrains Mono`, `Roboto Mono`, atau `System Monospace` dengan pengaturan CSS `font-variant-numeric: tabular-nums`.

### 4.2 Skala Ukuran & Bobot Teks

| Peran Tipografi | Ukuran | Line Height | Weight | Penerapan UI |
| :--- | :---: | :---: | :---: | :--- |
| **Telemetry Giant** | 44 px | 48 px | Bold (700) Monospace | Angka sisa air tangki (Liter) & jarak meter ke api |
| **Headline H1** | 20–22 px | 28 px | Bold (700) Sans | Nama lokasi kejadian aktif & header dasbor |
| **Section Title H2** | 15–16 px | 22 px | Semibold (600) Sans | Header panel unit armada & direktori hidran |
| **Body Data** | 13–14 px | 20 px | Regular (400) Sans | Alamat detail, nama posko, instruksi operasional |
| **Label / Eyebrow** | 11 px | 14 px | Bold (700) Monospace | Kode unit (`ATK-04`), stempel waktu, koordinat WGS 84 |

---

## 5. Spesifikasi Komponen Interaktif (Apple HIG & Ergonomi Taktis)

### 5.1 Tombol Darurat Warga 2.0 Detik (Haptic Press-and-Hold Button)
Komponen pelaporan darurat pada Citizen PWA dirancang untuk mengeliminasi laporan palsu (*prank call*) dan sentuhan tidak sengaja:
* **Dimensi Fisik:** Lingkaran berdiameter **140 dp** tepat di tengah layar dengan warna dasar merah pemadam `#DC2626`.
* **Cincin Progres Visual:** Garis tepi lingkaran SVG ketebalan **6 px** yang berputar memenuhi keliling tepat selama **2.000 ms** penahanan jari.
* **Pola Umpan Balik Haptic (Vibration API):**
  * *Touch Inisial:* Getaran pendek tunggal (40 ms) saat jari pertama kali menyentuh area tombol.
  * *Trigger Sukses:* Getaran ganda tegas (100 ms ON / 50 ms jeda / 150 ms ON) saat progres mencapai 100% dan laporan terkirim.
* **Pembatalan Spontan (Instant Abort):** Jika jari terangkat sebelum 2.0 detik tercapai (contoh: pada detik 1.2), lingkaran progres seketika kembali ke 0% dan tidak ada muatan data yang terkirim ke peladen.

### 5.2 Sakelar Barikade Selang Jalan (Hose Barricade Switch)
* **Dimensi:** Modul tombol berukuran **56 dp** dengan garis tepi fuchsia `#D946EF`.
* **Status Aktif:** Latar belakang berubah menjadi fuchsia gelap transparan (`rgba(217, 70, 239, 0.15)`) dengan teks tegas: `BARIKADE AKTIF: SELANG TERBENTANG`.
* **Aksi 1-Tap Realtime:** Sekali sentuh langsung menyiarkan garis rintangan selang (`LineString`) ke seluruh layar unit lapangan dan posko via Supabase Realtime CDC.

### 5.3 Tombol Pembaruan Status Air 1-Tap (Glove-Friendly Action Sheet)
* **Tiga Tombol Bersebelahan (Tinggi 52 dp):**
  * `[ READY ]` (Border `#10B981`, teks hijau emerald)
  * `[ DEBIT RENDAH ]` (Border `#F59E0B`, teks kuning amber)
  * `[ KERING ]` (Border `#64748B`, teks abu-abu slate)
* **Optimistic UI:** Mengetuk salah satu tombol langsung memperbarui status di penyimpanan lokal Isar DB perangkat seketika (< 10 ms) sebelum disinkronkan ke peladen.

### 5.4 Modal Dialog Konfirmasi Taktis FSM
* **Fungsi:** Melindungi aksi-aksi berisiko tinggi (Verifikasi Paksa, Selesai Operasi / Tutup Insiden).
* **Aksesibilitas & Fokus:** Dilengkapi atribut ARIA (`role="dialog" aria-modal="true"`), dukungan keyboard (`Escape` untuk membatalkan, `Enter` untuk konfirmasi), serta kontras tombol aksi `BATAL` vs `EKSEKUSI` yang kontras.

---

## 6. Ergonomi Peta Taktis Luring (Offline MBTiles & CartoDB Dark Canvas)

Peta vektor luring `.mbtiles` dan kanvas peta posko menggunakan palet gelap dengan hierarki garis jalan berbasis lebar fisik:

### 6.1 Pewarnaan Lapisan Vektor
* **Latar Dasar Daratan:** `#0B0E14`
* **Jaringan Jalan Arteri ($\ge 6\text{ m}$):** Garis lebar `#2D333B`
* **Jaringan Gang Sempit ($< 2.5\text{ m}$):** Garis tegas `#484F58` beraksen pembatas
* **Koridor Sungai Karang Mumus:** Poligon biru pekat `#0F2847` dengan garis tepian `#1D4ED8`
* **Bangunan Permukiman Padat:** Poligon netral `#161B22` dengan batas tipis 0.5 px

### 6.2 Marker Spasial Armada & Sumber Air
* **Titik Api / Pusat Insiden:** Ikon api merah 32 x 32 dp beraksen lingkaran konsensus geofencing 100 meter (garis putus-putus merah).
* **Unit ATTACKER:** Segitiga arah navigasi merah `#EF4444` berukuran 28 dp yang berputar mengikuti arah kompas perangkat.
* **Unit FEEDER:** Bujursangkar kuning `#F59E0B` berukuran 28 dp yang terkunci di jalan arteri utama.
* **Sumber Air / Hidran:** Ikon tetesan air 24 dp dengan warna status operasional dan teks jarak meter di bawahnya (contoh: `120M`).

---

## 7. Tata Letak Antarmuka Per Platform

### 7.1 Citizen Emergency PWA (`apps/pwa-citizen`)
* **Struktur Tampilan:** *Single-viewport zero-scroll* pada layar ponsel standar (360 x 640 px s.d. 412 x 915 px).
* **Header:** Teks posko pemadam dan status geolokasi: `STATUS KOORDINAT: TERKUNCI (±4.0m)`.
* **Pusat Layar:** Tombol darurat Press-and-Hold 2.0 detik.
* **Bawah Layar:** Input nomor telepon / WhatsApp pelapor dan kartu konsensus waktu nyata 180 detik.

### 7.2 Dasbor Komando Posko Induk (`apps/web-command`)
* **Tata Letak 3 Kolom Taktis:**
  * **Kolom Kiri (Lebar 320 px):** Antrean insiden aktif, status konsensus warga, dan indikator pasang surut Sungai Karang Mumus (SKM).
  * **Kolom Tengah (Fleksibel):** Kanvas peta interaktif Leaflet.js layar penuh bertema CartoDB Dark Matter dengan visualisasi pergerakan armada dan garis selang fuchsia.
  * **Kolom Kanan (Lebar 360 px):** Matriks Auto-Split armada (`ATTACKER`/`FEEDER`), tombol kontrol transisi siklus hidup FSM, dan log aliran telemetri kronologis.

### 7.3 Aplikasi Mobile Relawan Lapangan (`apps/mobile-volunteer`)
* **Header Taktis (Tinggi 56 dp):**
  * Teks mode peran: `MODE ATTACKER` (Latar merah gelap) atau `MODE FEEDER` (Latar amber gelap).
  * Indikator antrean sinkronisasi: `OFFLINE (2 ANTREAN)` atau `ONLINE (TERHUBUNG)`.
* **Area Peta Utama:** Mengisi 60% tinggi layar ponsel untuk navigasi gang sempit.
* **Panel Kontrol Aksi Bawah:** Mengisi 40% tinggi layar ponsel dengan tombol minta tekanan pompa 64 dp dan modul 3 sumber air terdekat.

---

## 8. Standar Salinan Teks Antarmuka (No-AI-Slop Copywriting Standard)

Seluruh label teks pada tombol, dialog, dan pesan sistem harus singkat, tegas, konkret, dan langsung menunjukkan tindakan operasional nyata tanpa bunga bahasa atau kata-kata pengisi:

| Komponen | Hindari (Slop / Bunga Bahasa) | Wajib Digunakan (Tegas & Konkret) |
| :--- | :--- | :--- |
| **Tombol Lapor Warga** | Sentuh Di Sini untuk Memfasilitasi Bantuan Pemadaman | TAHAN 2 DETIK UNTUK LAPOR KEBAKARAN |
| **Tombol Tekanan Air** | Minta Peningkatan Tekanan Air Demi Kelancaran Serbu | MINTA TEKANAN POMPA (5.0 BAR) |
| **Tombol Barikade** | Aktifkan Proteksi Selang dari Kendaraan Melintas | AKTIFKAN BARIKADE SELANG |
| **Pembaruan Hidran** | Catat Bahwa Sumber Air Ini Dalam Keadaan Sangat Baik | HIDRAN SIAP PAKAI |
| **Kesalahan GPS** | Maaf, terjadi anomali dalam mendeteksi koordinat Anda | GPS MATI. AKTIFKAN LOKASI PERANGKAT ANDA. |
| **Koneksi Putus** | Sistem sedang berusaha menyambungkan kembali koneksi | MODE LURING. 3 MUTASI TERSIMPAN DI PONSEL. |
| **Verifikasi Posko** | Lakukan Proses Eskalasi Status Insiden Secara Manual | VERIFIKASI PAKSA OPERATOR |

---

## 9. Pre-Delivery Checklist Kualitas UI/UX (Quality Assurance)

Sebelum menyerahkan kode antarmuka ke lingkungan produksi, setiap komponen wajib melewati daftar periksa berikut:

- [x] **Accessibility (WCAG AAA):** Kontras teks utama minimal 7:1 terhadap latar `#07090E`.
- [x] **Touch Target Floor:** Area interaksi tombol aksi kritis minimal $48 \times 48\text{ dp}$ (52–64 dp pada aksi utama).
- [x] **Zero Pill Chips:** Tidak ada kontainer kapsul oval mengambang atau dot berkedip dekoratif di seluruh tampilan.
- [x] **No Emoji Icons:** Seluruh simbol menggunakan ikon vektor monoline SVG terukur.
- [x] **Themed Browser Surfaces:** Warna seleksi teks diatur seragam (`selection:bg-red-950 selection:text-red-200`) dan scrollbar tipis gelap.
- [x] **Tabular Numerals:** Seluruh angka metrik menggunakan `tabular-nums` pada font monospace.
- [x] **Haptic Feedback:** Tombol darurat warga mematuhi pola getaran tepat (40 ms sentuh, 100/50/150 ms sukses, abort instan).
- [x] **Reduced Motion Support:** Mendukung kueri media `prefers-reduced-motion` untuk personel yang sensitif terhadap pergerakan layar.
