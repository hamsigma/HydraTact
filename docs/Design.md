# SISTEM DESAIN & ERGONOMI TAKTIS

Nama Produk: HydraTact Samarinda  
Versi: 2.2.0  
Standar: Apple Human Interface Guidelines, Impeccable (Operate Mode), Minimalist UI, No AI Slop  
Lingkup: Web Command Center (apps/web-command), Citizen Emergency PWA (apps/pwa-citizen), Mobile Volunteer App (apps/mobile-volunteer)  
Tujuan: Mempercepat pembacaan data dan kendali fisik personel damkar saat menangani kebakaran di gang sempit Kota Samarinda.

---

## 1. Prinsip Operasi Lapangan

Antarmuka beroperasi dalam situasi darurat: asap pekat, getaran kendaraan pemadam, pantulan sinar matahari siang, pemadaman listrik total, dan pengoperasian dengan sarung tangan basah.

1. **Kontras Teks Minimal 7:1 (WCAG AAA)**  
   - Kanvas Terang Web Command Center (`#F8F9FA`): Teks utama `#0F172A` (rasio kontras 15.2:1). Teks sekunder `#475569` (rasio kontras 7.1:1).  
   - Kanvas Gelap Mobile Volunteer (`#07090E`): Teks utama `#F0F6FC` (rasio kontras 15.8:1).
2. **Ukuran Target Sentuh Fisik**  
   - Tombol umum minimal 48 x 48 dp.  
   - Tombol darurat dan eskalasi (lapor darurat, barikade selang, verifikasi paksa) berukuran 52 dp hingga 64 dp dengan animasi penekanan fisik (`active:scale-[0.98]`).
3. **Angka Telemetri Stabil (Tabular Numerals)**  
   Semua data terukur (meter jarak, Bar tekanan, Liter isi tangki, detik hitung mundur) wajib memakai properti CSS `font-variant-numeric: tabular-nums` pada font monospace. Nilai yang bergerak cepat tidak boleh menggeser posisi tata letak teks di sebelahnya.
4. **Tanpa Dekorasi Visual**  
   Tanpa gradien warna, tanpa bayangan mengambang tebal, tanpa kartu bersarang di dalam kartu lain. Setiap elemen visual harus langsung melayani pembacaan data atau penekanan aksi kendali.

---

## 2. Aturan Pembatasan Komponen

Aturan mutlak untuk seluruh antarmuka sistem:

### 2.1 Komponen Terlarang
* **Pill Chips dan Badge Lonjong:** Dilarang membungkus teks status, kategori, atau catatan ke dalam kontainer kapsul membulat penuh (`rounded-full` lonjong `px-3 py-1`).
* **Dot Berkedip Dekoratif:** Dilarang memasang dot kecil berkedip (`animate-pulse`) di dalam kapsul status.
* **Badge Mengambang di Atas Judul:** Dilarang menaruh badge mengambang di atas judul utama (H1).
* **Kartu Bertumpuk (Cards Inside Cards):** Dilarang membungkus kartu ke dalam kartu lain secara bertingkat.
* **Emoji:** Dilarang menggunakan emoji Unicode sebagai ikon. Gunakan ikon SVG monoline.

### 2.2 Format Pengganti
1. **Label Kategori:** Gunakan teks monospace tebal kapital tanpa kontainer latar belakang:
   ```css
   font-family: monospace;
   font-size: 11px;
   font-weight: 700;
   letter-spacing: 0.15em;
   text-transform: uppercase;
   color: #64748B;
   margin-bottom: 6px;
   ```
2. **Status Operasional:** Teks monospace tebal langsung dengan warna penanda:
   ```css
   font-family: monospace;
   font-size: 12px;
   font-weight: 700;
   color: #059669; /* Status READY atau VERIFIED */
   ```
3. **Catatan Operasional:** Gunakan blok teks datar berbatas garis 1 px pada sisi kiri (`border-l-2 border-slate-300 pl-3`).

---

## 3. Spesifikasi Palet Warna

### 3.1 Web Command Center (Light Mode Utilitarian)
Dirancang untuk monitor posko komando di ruangan terang atau siang hari:
```css
:root {
  --color-surface-0: #F8F9FA; /* Latar kanvas utama */
  --color-surface-1: #FFFFFF; /* Latar panel dan kartu data */
  --color-surface-2: #F1F5F9; /* Latar modal dan dialog konfirmasi */

  --color-border-subtle: #E2E8F0; /* Batas panel 1 px */
  --color-border-active: #CBD5E1; /* Batas panel aktif */

  --color-text-primary: #0F172A;   /* Slate 900 (WCAG AAA) */
  --color-text-secondary: #475569; /* Slate 600 (WCAG AAA) */
  --color-text-muted: #64748B;     /* Slate 500 */

  --color-attacker: #DC2626;  /* Merah pekat unit serbu dan titik api */
  --color-feeder: #D97706;    /* Amber unit tangki jalan raya */
  --color-commander: #0284C7; /* Biru posko komando */
  --color-barricade: #C026D3; /* Fuchsia barikade selang */

  --color-water-ready: #059669;   /* Hijau debit air memadai */
  --color-water-low: #D97706;     /* Amber debit rendah < 2.0 Bar */
  --color-water-empty: #64748B;   /* Slate tandon kering atau hidran kosong */
  --color-water-damaged: #DC2626; /* Merah fisik hidran rusak */
}
```

### 3.2 Mobile Volunteer App (Tactical Dark Mode)
Dirancang untuk menghemat baterai layar OLED dan menjaga adaptasi gelap mata personel di lokasi kebakaran malam hari:
* Kanvas Latar: `#07090E`
* Kartu Data: `#0D1117`
* Garis Batas: `#21262D`
* Teks Utama: `#F0F6FC`

---

## 4. Tipografi

* **Teks Umum dan Judul:** Inter, Geist Sans, atau font sans-serif bawaan sistem operasi.
* **Data Numerik, Kode Panggilan Unit, dan Koordinat:** Geist Mono, JetBrains Mono, atau font monospace sistem operasi dengan aturan `font-variant-numeric: tabular-nums`.

| Peran | Ukuran | Bobot | Penggunaan |
| :--- | :---: | :---: | :--- |
| **Telemetry Giant** | 44 px | Bold Monospace | Volume tangki sisa (L) dan jarak ke api (m) |
| **Headline H1** | 20 px | Bold Sans | Nama lokasi insiden aktif |
| **Section Title H2** | 15 px | Semibold Sans | Header panel armada dan hidran |
| **Body Data** | 13 px | Regular Sans | Rincian alamat dan instruksi operasional |
| **Label atau Eyebrow** | 11 px | Bold Monospace | Tanda panggilan unit, waktu, koordinat |

---

## 5. Komponen Interaktif

### 5.1 Tombol Lapor Darurat Warga 2.0 Detik (apps/pwa-citizen)
* **Bentuk:** Lingkaran diameter 140 dp warna `#DC2626`.
* **Cincin Progres:** Garis SVG tebal 6 px berputar penuh selama 2000 ms sentuhan ditahan.
* **Getaran Fisik (Vibration API):**
  * Sentuhan awal: 40 ms.
  * Laporan terkirim: Pola ganda 100 ms ON / 50 ms OFF / 150 ms ON.
* **Pembatalan:** Pelepasan jari sebelum 2.0 detik membatalkan pengiriman seketika dan cincin kembali ke 0%.

### 5.2 Sakelar Barikade Selang Jalan (apps/web-command)
* **Dimensi:** Tombol tinggi 48–56 dp bergaris batas fuchsia `#C026D3`.
* **Status Aktif:** Latar transparan fuchsia (`#FDF4FF`), teks: `BARIKADE AKTIF: SELANG TERBENTANG`.
* **Aksi:** Sekali sentuh menyiarkan data barikade jalan ke seluruh armada via Supabase Realtime CDC.

### 5.3 Tombol Status Hidran 1-Tap (apps/mobile-volunteer)
Tiga tombol bersebelahan dengan tinggi 52 dp:
* `[ READY ]` (Border `#059669`, teks hijau)
* `[ DEBIT RENDAH ]` (Border `#D97706`, teks amber)
* `[ KERING ]` (Border `#64748B`, teks slate)

### 5.4 Dialog Konfirmasi Transisi FSM (apps/web-command)
* **Tujuan:** Mencegah salah pencet aksi kritis (Verifikasi Paksa, Tutup Insiden).
* **Aksesibilitas:** Atribut ARIA `role="dialog"` dan `aria-modal="true"`.
* **Pintasan Keyboard:** Tombol `Escape` untuk membatalkan, tombol `Enter` untuk mengeksekusi.

---

## 6. Peta Taktis OpenStreetMap (Samarinda Kota)

Peta memakai ubin resmi **OpenStreetMap Standar** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) untuk menampilkan jalan, gang, dan toponimi Kota Samarinda secara presisi.

### 6.1 Koordinat Terkalibrasi ke Jaringan Jalan
* **Titik Api Gg. 4 Jl. Pelita:** `[-0.4848, 117.1628]` (di dalam gang sempit permukiman, penanda radar lingkaran berdenyut merah).
* **Posisi Parkir Truk Feeder Jl. Pelita:** `[-0.4840, 117.1638]` (di badan jalan raya berlebar 6 meter).
* **Garis Barikade Selang:** Garis putus-putus fuchsia tebal 5 px dari posisi truk Feeder ke titik api sepanjang 110 meter.
* **Titik Api Gg. Madura Pasar Segiri:** `[-0.4828, 117.1480]`.
* **30 Titik Sumber Air:** Terkunci di sisi jalan raya, persimpangan gang, dan dermaga sedot sungai dengan penanda lingkaran hijau/amber/slate.
* **Badan Air Alami:** Sungai Karang Mumus dan Sungai Mahakam tampil langsung dari ubin peta dasar OpenStreetMap tanpa garis poligon buatan.

---

## 7. Tata Letak Dasbor Web Command Center (Clean Bento Grid)

1. **Sidebar Navigasi Ikon Ramping (76 px Dark Rail):**  
   Navigasi vertikal dengan latar belakang gelap obsidian `#111215`, tombol logo squircle krem `#F5E6CC`, ikon monoline bersih dengan floating tooltip, serta tombol keluar/status di bagian bawah.
2. **Header Ringkas Area Kerja:**  
   Menampilkan judul "Overview" posko, detail sektor Samarinda, serta ikon pencarian, lonceng notifikasi siaga, dan kartu profil Komandan Jaga.
3. **Baris Atas Hero Bento (Tinggi 520 px):**  
   - **Hero Map Card (Span 8):** Kanvas peta interaktif OpenStreetMap Samarinda (WGS 84) diperluas maksimal dengan penanda lingkaran radar aktif, kontrol filter air ramping di pojok atas, dan status barikade selang.
   - **3 Kartu Status Pastel Vertikal (Span 4):**
     * Soft Lavender (`#F3E8FF`): Armada Taktis (Rasio Unit Attacker vs Feeder, tekanan 4.0 Bar dengan ikon lingkaran).
     * Soft Mint (`#ECFDF5`): Logistik Air Siaga (30 Titik Hidran/Tandon, cakupan 100% GIS dengan ikon lingkaran).
     * Soft Amber (`#FFFBEB`): Sungai Karang Mumus (Pasang Maksimal +1.80m, salinitas 0.05% dengan ikon lingkaran).
4. **Baris Bawah:**  
   - **Tabel Antrean Insiden (Span 7):** Daftar insiden kebakaran dan laporan konsensus warga dengan stempel waktu, status FSM, dan tombol fokus peta.
   - **Kartu Gelap Kontras Aksi Cepat (Span 5):** Kartu gelap `#141518` dengan grafis geometrik berlatar tipis, status siaga, tombol aksi FSM (Verifikasi Paksa, Dispatch), dan sakelar barikade selang relay fuchsia.

---

## 8. Standar Salinan Teks Operasional

Setiap label tombol, pesan dialog, dan status sistem ditulis singkat, tegas, konkret, dan langsung menunjukkan tindakan:

| Komponen | Salinan Dilarang (AI Slop) | Salinan Wajib (Taktis Langsung) |
| :--- | :--- | :--- |
| **Tombol Lapor** | Sentuh Di Sini untuk Memfasilitasi Bantuan | TAHAN 2 DETIK UNTUK LAPOR |
| **Minta Tekanan** | Minta Peningkatan Tekanan Pompa Demi Kelancaran | MINTA TEKANAN POMPA (7.0 BAR) |
| **Barikade** | Aktifkan Proteksi Selang dari Kendaraan Melintas | AKTIFKAN BARIKADE SELANG |
| **Status Hidran** | Catat Bahwa Sumber Air Ini Dalam Kondisi Baik | HIDRAN SIAP PAKAI |
| **GPS Mati** | Maaf, terjadi anomali dalam mendeteksi koordinat Anda | GPS MATI. NYALAKAN LOKASI PERANGKAT. |
| **Koneksi Putus** | Sistem sedang berusaha menyambungkan kembali koneksi | KONEKSI PUTUS. 3 MUTASI TERSIMPAN DI PONSEL. |
| **Verifikasi Posko** | Lakukan Proses Eskalasi Status Insiden Secara Manual | VERIFIKASI PAKSA OPERATOR |

---

## 9. Daftar Periksa Mutu Antarmuka

Sebelum kode dinyatakan selesai:
- [x] Kontras teks utama terhadap latar belakang minimal 7:1 (WCAG AAA).
- [x] Luas target sentuh tombol aksi minimal 48 x 48 dp (52 dp untuk aksi darurat).
- [x] Tidak ada kontainer kapsul oval (*pill chip*) atau dot berkedip dekoratif di seluruh halaman.
- [x] Semua ikon menggunakan format SVG monoline.
- [x] Seluruh angka data telemetri menggunakan `tabular-nums`.
- [x] Koordinat insiden kebakaran, hidran, dan barikade menempel pada jalan nyata OpenStreetMap.
- [x] Salinan teks bersih dari kata klise dan struktur berbelit AI slop.
