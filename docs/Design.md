# SISTEM DESAIN & ERGONOMI TAKTIS (DESIGN SPECIFICATION)

**Nama Produk:** HydraTact Samarinda  
**Versi Dokumen:** 1.0.0 (MVP KMM AST-PTMA 2026)  
**Lingkup Antarmuka:** Web Command Center, Citizen Emergency PWA, Mobile Field App (Flutter)  
**Tujuan Desain:** Efisiensi navigasi pemadaman kebakaran permukiman padat pada kondisi stres tinggi tanpa beban kognitif tambahan.

---

## 1. Prinsip Desain Kondisi Stres Tinggi

Antarmuka HydraTact dioperasikan dalam lingkungan darurat: asap pekat, getaran kendaraan pemadam, cahaya terik siang hari atau gelap total malam hari, serta personel lapangan yang menggunakan sarung tangan basah. Desain sistem didasarkan pada empat prinsip:

1. **Prioritas Kontras Mutlak (WCAG AAA):** Seluruh elemen teks dan indikator data wajib memenuhi rasio kontras minimal 7:1 terhadap latar belakang.
2. **Target Sentuh Ramah Sarung Tangan:** Area interaksi utama memiliki ukuran fisik minimal 48 x 48 dp dan 56 hingga 64 dp untuk tindakan darurat langsung.
3. **Kestabilan Tipografi Numerik:** Seluruh angka metrik (jarak meter, lebar jalan, kapasitas tangki, durasi detik) menggunakan font monospace dengan atribut `tabular-nums` agar tidak bergeser saat nilai diperbarui.
4. **Bebas Distraksi Visual:** Dilarang menggunakan animasi dekoratif, gradien warna berlebihan, atau kartu berlapis-lapis. Informasi disajikan dalam susunan bidang datar dengan batas garis tipis berukuran 1 px.

---

## 2. Larangan Mutlak Elemen Antarmuka (Banned UI Elements)

Sesuai aturan operasional antarmuka HydraTact, seluruh komponen berikut dilarang digunakan di seluruh platform:

### 2.1 Larangan Pill Chips dan Oval Badges
* Dilarang membungkus teks status, kategori, atau catatan ke dalam kontainer kapsul membulat penuh (`rounded-full` dengan padding lonjong).
* Dilarang meletakkan chip mengambang di atas judul utama (H1), hero header, atau kartu data.
* Dilarang menggunakan dot indikator dekoratif berkedip (`animate-pulse`) di dalam kapsul.

### 2.2 Standar Pengganti (Minimalist Plain-Text Standard)
1. **Section Eyebrow dan Kategori:**  
   Gunakan teks tipografi murni tanpa latar belakang, tanpa border, dan tanpa dot:
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
   Judul berdiri sendiri secara tegas di puncak hierarki visual tanpa hiasan chip di atasnya.
3. **Status Operasional dan Metrik:**  
   Tampilkan status sebagai teks langsung dengan bobot tebal dan jenis font monospaced:
   ```css
   font-family: monospace;
   font-size: 13px;
   font-weight: 700;
   color: #10B981; /* Hijau Emerald untuk READY */
   ```
4. **Catatan dan Informasi Penjelas:**  
   Gunakan blok teks biasa dengan batas garis vertikal 2 px di sisi kiri (`border-l-2 border-slate-700 pl-3`), bukan chip mengambang.

---

## 3. Sistem Warna Taktis (Color Tokens)

Palet warna menggunakan fondasi gelap pekat (*Tactical OLED Dark*) untuk mengurangi konsumsi daya layar baterai personel lapangan dan menjaga ketajaman visual di tengah kepulan asap.

### 3.1 Warna Latar Belakang (Surface Hierarchy)
* **Base Canvas (`surface-0`):** `#07090E` (Latar belakang utama seluruh aplikasi)
* **Card Surface (`surface-1`):** `#0D1117` (Permukaan panel data, kartu unit, dan lembar kontrol)
* **Overlay Surface (`surface-2`):** `#161B22` (Dialog konfirmasi, modal, dan sheet aksi)
* **Surface Border (`border-subtle`):** `#21262D` (Garis pembatas 1 px antar panel data)
* **Surface Border Active (`border-active`):** `#30363D` (Garis pembatas panel yang sedang aktif)

### 3.2 Tipografi dan Teks Kontras Tinggi
* **Text Primary:** `#F0F6FC` (Kontras 15.8:1 terhadap `#07090E`, lolos WCAG AAA)
* **Text Secondary:** `#8B949E` (Kontras 7.2:1 terhadap `#07090E`, lolos WCAG AAA)
* **Text Muted / Disabled:** `#484F58` (Teks tidak aktif / non-interaktif)

### 3.3 Aksen Peran Lapangan dan Indikator Spasial
* **Peran ATTACKER:** `#EF4444` (Merah pekat; penanda unit serbu gang sempit dan tombol darurat)
* **Peran FEEDER:** `#F59E0B` (Amber reflektif; penanda truk tangki pengumpan di jalan arteri)
* **Peran COMMANDER / Taktis:** `#38BDF8` (Sky Cyan; penanda fokus peta dan kueri operator)
* **Garis Barikade Selang:** `#D946EF` (Fuchsia neon; kontras tertinggi di atas aspal gelap dan citra satelit)

### 3.4 Status Logistik Air (Water Source Status)
* **`READY`:** `#10B981` (Hijau Emerald; debit air deras $\ge 4.0\text{ Bar}$, siap dihisap)
* **`LOW_DISCHARGE`:** `#F59E0B` (Amber peringatan; debit air lemah $< 2.0\text{ Bar}$, butuh pompa hisap)
* **`EMPTY`:** `#64748B` (Slate redup; tandon kering / hidran tidak mengalir)
* **`DAMAGED`:** `#DC2626` (Merah padam; fisik hidran patah / pipa distribusi rusak)

---

## 4. Tipografi dan Skala Hierarki

Sistem menggunakan font sans-serif berbobot netral untuk instruksi umum, dan font monospaced berlebar tetap untuk seluruh sajian telemetri.

### 4.1 Pemilihan Keluarga Font
* **Antarmuka Utama (Display & Body):** `Inter`, `Roboto`, atau `System Sans-Serif`.
* **Data Telemetri & Koordinat:** `JetBrains Mono`, `Roboto Mono`, atau `System Monospace` dengan pengaturan CSS `font-variant-numeric: tabular-nums`.

### 4.2 Skala Ukuran Teks
| Peran Tipografi | Ukuran | Line Height | Weight | Penerapan |
| :--- | :--- | :--- | :--- | :--- |
| **Telemetry Giant** | 44 px | 48 px | Bold (700) Monospace | Angka sisa air tangki (Liter) & jarak meter gang |
| **Headline H1** | 22 px | 28 px | Bold (700) Sans | Judul layar utama, nama lokasi kejadian aktif |
| **Section Title H2** | 16 px | 22 px | Semibold (600) Sans | Header panel unit armada & daftar sumber air |
| **Body Data** | 14 px | 20 px | Regular (400) Sans | Alamat lokasi, nama posko, instruksi rute |
| **Label / Eyebrow** | 11 px | 14 px | Bold (700) Monospace | Kode unit (`ATK-04`), status operasional, stempel waktu |

---

## 5. Spesifikasi Komponen Interaktif

### 5.1 Standar Target Sentuh (Touch Target Area)
* **Aksi Umum:** Minimal 48 x 48 dp (sesuai pedoman aksesibilitas Android dan iOS).
* **Aksi Taktis Kritis:** Tinggi 56 hingga 64 dp dengan lebar penuh (*full-width block*). Diterapkan pada tombol konfirmasi status air, sakelar barikade selang, dan tombol darurat.

### 5.2 Tombol Darurat Warga 2.0 Detik (Haptic Press-and-Hold)
Komponen pelaporan darurat pada Citizen PWA dirancang untuk mencegah pemicuan tanpa sengaja:
* **Bentuk Fisik:** Lingkaran berdiameter 140 dp di tengah layar dengan warna dasar `#DC2626`.
* **Cincin Progres Visual:** Garis tepi SVG ketebalan 6 px yang berputar memenuhi keliling lingkaran tepat selama 2.000 ms penahanan jari.
* **Umpan Balik Haptic:**
  * Getaran pendek (40 ms) saat jari pertama kali menyentuh tombol.
  * Getaran ganda tegas (100 ms aktif, 50 ms jeda, 150 ms aktif) saat progres mencapai 100% dan muatan laporan berhasil dikirim.
* **Pembatalan Spontan:** Jika jari terangkat sebelum 2.0 detik tercapai, lingkaran progres kembali ke 0 ms seketika tanpa pengiriman paket ke peladen.

### 5.3 Sakelar Barikade Selang Jalan (Hose Barricade Switch)
* **Ukuran:** Modul tombol berukuran 56 dp berwarna gelap dengan border `#D946EF`.
* **Status Aktif:** Latar belakang berubah menjadi fuchsia gelap (`rgba(217, 70, 239, 0.15)`) dengan teks tegas: `BARIKADE AKTIF: SELANG TERBENTANG`.
* **Aksi 1-Tap:** Mengaktifkan atau menonaktifkan garis `LineString` barikade pada peta seluruh unit dalam satu ketukan.

### 5.4 Tombol Pembaruan Status Air 1-Tap
* Tiga tombol berdampingan dengan tinggi masing-masing 52 dp:
  * `[ READY ]` (Border `#10B981`, teks hijau)
  * `[ DEBIT RENDAH ]` (Border `#F59E0B`, teks kuning)
  * `[ KERING ]` (Border `#64748B`, teks abu-abu)
* Mengetuk salah satu tombol langsung memperbarui status di Isar DB lokal (*Optimistic UI*) dan menyebarkannya ke seluruh unit armada.

---

## 6. Ergonomi Peta Taktis Luring

Peta vektor lokal `.mbtiles` dirender dengan profil kontras khusus operasi darurat:

### 6.1 Pewarnaan Lapisan Vektor Peta
* **Latar Dasar Daratan:** `#0B0E14`
* **Jaringan Jalan Arteri ($\ge 6\text{ m}$):** Garis lebar `#2D333B`
* **Jaringan Gang Sempit ($< 2.5\text{ m}$):** Garis tegas `#484F58` beraksen pembatas
* **Koridor Sungai Karang Mumus:** Poligon biru pekat `#0F2847` dengan garis tepian `#1D4ED8`
* **Bangunan Permukiman Padat:** Poligon netral `#161B22` dengan batas 0.5 px

### 6.2 Marker Spasial Armada dan Lokasi
* **Titik Api / Pusat Insiden:** Ikon api tegas berukuran 32 x 32 dp beraksen cincin konsensus 100 meter (garis putus-putus merah transparan).
* **Unit ATTACKER:** Segitiga arah navigasi merah `#EF4444` berukuran 28 dp yang berputar mengikuti arah kompas perangkat.
* **Unit FEEDER:** Bujursangkar kuning `#F59E0B` berukuran 28 dp yang terkunci di jalan arteri utama.
* **Sumber Air:** Ikon tetesan air berukuran 24 dp dengan warna sesuai status operasional, dilengkapi angka jarak meter di bawah ikon (contoh: `120m`).

---

## 7. Tata Letak Antarmuka Per Platform

### 7.1 Citizen Emergency PWA (`apps/pwa-citizen`)
* **Struktur Tampilan:** Single-viewport tanpa gulir (*zero scroll* pada layar ponsel standar).
* **Header:** Judul "HYDRATACT SAMARINDA" dan teks akurasi lokasi: `GPS: AKURAT (± 4 METER)`.
* **Pusat Layar:** Tombol darurat Press-and-Hold 2.0 detik.
* **Bawah Layar:** Input nomor telepon / WhatsApp darurat dan kartu status konsensus warga sekitar.

### 7.2 Aplikasi Mobile Relawan Lapangan (`apps/mobile-volunteer`)
* **Header Taktis (Tinggi 56 dp):**
  * Teks mode peran: `MODE ATTACKER` (Latar merah gelap) atau `MODE FEEDER` (Latar amber gelap).
  * Indikator antrean sinkronisasi: `OFFLINE (2 ANTREAN)` atau `ONLINE (TERHUBUNG)`.
* **Area Peta Utama:** Mengisi 60% tinggi layar ponsel untuk navigasi gang.
* **Panel Kontrol Aksi Bawah (Tinggi 40% layar):**
  * Baris 1: Tombol minta tekanan air (khusus Attacker) atau sakelar barikade (khusus Feeder).
  * Baris 2: Kartu 3 sumber air terdekat dengan jarak meter dan tombol 1-tap pembaruan status.

### 7.3 Dasbor Komando Posko Induk (`apps/web-command`)
* **Tata Letak 3 Kolom Taktis:**
  * **Kolom Kiri (Lebar 320 px):** Daftar antrean insiden aktif, status konsensus warga, dan tombol kontrol FSM (`VERIFIKASI PAKSA`, `DISPATCH`, `PENDINGINAN`, `TUTUP INSIDEN`).
  * **Kolom Tengah (Fleksibel):** Kanvas peta interaktif Leaflet.js layar penuh dengan lapisan pasang-surut Sungai Karang Mumus dan pergerakan armada.
  * **Kolom Kanan (Lebar 360 px):** Matriks telemetri armada relawan, daftar alokasi unit Attacker/Feeder, dan log mutasi waktu nyata.

---

## 8. Standar Salinan Teks Antarmuka (No-AI-Slop Interface Copy)

Seluruh label teks pada tombol, dialog, dan pesan sistem harus singkat, tegas, dan langsung menunjukkan tindakan nyata tanpa kata-kata pengisi:

| Komponen | Hindari (Slop / Bunga Bahasa) | Wajib Digunakan (Tegas & Konkret) |
| :--- | :--- | :--- |
| **Tombol Lapor Warga** | Sentuh Di Sini untuk Memfasilitasi Bantuan Pemadaman | TAHAN 2 DETIK UNTUK LAPOR KEBAKARAN |
| **Tombol Tekanan Air** | Minta Peningkatan Tekanan Air Demi Kelancaran Serbu | MINTA TEKANAN POMPA (5.0 BAR) |
| **Tombol Barikade** | Aktifkan Proteksi Selang dari Kendaraan Melintas | AKTIFKAN BARIKADE SELANG |
| **Pembaruan Hidran** | Catat Bahwa Sumber Air Ini Dalam Keadaan Sangat Baik | HIDRAN SIAP PAKAI |
| **Kesalahan GPS** | Maaf, terjadi anomali dalam mendeteksi koordinat Anda | GPS MATI. AKTIFKAN LOKASI PERANGKAT ANDA. |
| **Koneksi Putus** | Sistem sedang berusaha menyambungkan kembali koneksi | MODE LURING. 3 MUTASI TERSIMPAN DI PONSEL. |
| **Verifikasi Posko** | Lakukan Proses Eskalasi Status Insiden Secara Manual | VERIFIKASI PAKSA OPERATOR |
