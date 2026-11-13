# NASKAH & PANDUAN PRODUKSI VIDEO DEMO KOMPETISI KMM AST-PTMA 2026
**Task ID:** `TASK-505`  
**PIC Kolaborasi:** `@Hervino`, `@Ilham`, `@Ariyadi`  
**Target Durasi:** Tepat `04:20` (Maksimal 5 Menit Sesuai Ketentuan Panitia)  
**Format Penamaan YouTube:**  
`[KMM AST-PTMA 2026] - HydraTact Samarinda: Platform Taktis Penanggulangan Kebakaran Gang Sempit Berbasis Peta Luring & Koordinasi Armada Relawan`  
**Resolusi:** 1080p Full HD (60 FPS), Rasio 16:9, Audio Stereo Dual-Track (Voiceover + UI Foley Sound)  

---

## 1. Ringkasan Cerita (Storyline Summary)
Video memperagakan skenario nyata kejadian kebakaran rumah kayu di kawasan permukiman padat **Jl. Pelita Gg. 4, Samarinda**:
- **Tantangan:** Lorong gang sempit $< 2.5\text{ m}$, sinyal seluler hilang (*dead-zone*), dan ancaman truk tangki besar tersangkut menutupi jalur evakuasi.
- **Solusi HydraTact:** Warga melapor via PWA tanpa install, posko menerima konsensus otomatis, peta MBTiles luring memandu unit kecil (ATTACKER) masuk ke pusat api dan mengunci truk tangki besar (FEEDER) di jalan arteri $\ge 6\text{ m}$ sembari menggelar barikade selang dan mencari hidran terdekat.

---

## 2. Tabel Runtutan Waktu & Naskah Narasi (*Timeline Breakdown*)

### Segmen 1: Pengantar Masalah Nyata di Samarinda (`00:00` - `00:45`)
* **Visual:** Cuplikan video arsip kebakaran di Samarinda (lorong sempit berdesakan, relawan berteriak di radio HT yang tumpang tindih suara *noise*). Teks tipografi tebal: *48-55 Kebakaran/Tahun di Kota Samarinda*.
* **Narasi Voiceover (VO):**  
  > *"Samarinda, kota dengan ribuan gang sempit dan permukiman kayu padat tepi sungai. Setiap menit sangat berharga saat api berkobar. Namun, komunikasi konvensional via radio HT dan WhatsApp sering kali memicu kekacauan: truk tangki 5.000 liter nekat masuk gang buntu hingga macet, laporan palsu menyia-nyiakan armada, dan sinyal internet mati saat relawan mendekati titik api. Memperkenalkan: HYDRATACT SAMARINDA."*

### Segmen 2: Pelaporan Warga & Konsensus Spasial Anti-Prank (`00:45` - `01:30`)
* **Visual:** Layar ponsel warga membuka Citizen Emergency PWA (`apps/pwa-citizen`). Warga menahan tombol merah darurat lingkaran 140 px. Cincin progres visual 6 px SVG berputar selama 2.000 ms diiringi getaran haptic dan teks persentase monospaced hingga status berubah `TERKIRIM`.
* **Demonstrasi Pembatalan:** Percobaan melepas jari pada detik 1.2 menunjukkan cincin langsung reset ke nol seketika tanpa ada laporan terkirim.
* **Narasi Voiceover (VO):**  
  > *"Bagi warga, kecepatan dan kemudahan adalah kunci. Melalui Citizen PWA tanpa unduh di app store, warga cukup menahan tombol darurat selama dua detik. Umpan balik getar haptic dan cincin progres SVG memastikan laporan tidak terpencet sengaja di kantong celana. Begitu dua laporan warga dalam radius 100 meter terdeteksi, mesin konsensus geofencing otomatis memverifikasi insiden secara sah tanpa bergantung pada sensor fisik berbiaya mahal."*

### Segmen 3: Tampilan Taktis Mobile Relawan (ATTACKER vs FEEDER) (`01:30` - `02:30`)
* **Visual:** Antarmuka ponsel relawan (`apps/mobile-volunteer`). Peta gelap MBTiles vektor luring Jl. Pelita Gg. 4 terbuka instan dalam 68 ms.
* **Mode ATTACKER:** Panel bawah merah gelap menampilkan tombol minta tekanan pompa 64 dp (`5.0 BAR`) dan jarak ke api `35 M`.
* **Mode FEEDER:** Panel kuning amber mengunci posisi truk di Jl. Pelita Utama ($\ge 6\text{ m}$) dan sakelar barikade selang fuchsia aktif (`BARIKADE AKTIF: SELANG TERBENTANG`) yang langsung menggambar garis rintangan selang di peta.
* **Narasi Voiceover (VO):**  
  > *"Di tangan relawan, aplikasi mobile HydraTact secara cerdas membagi peran operasi. Unit pompa portabel kecil bertindak sebagai ATTACKER yang masuk ke gang sempit dengan tombol besar 64 dp yang nyaman ditekan dengan sarung tangan tebal. Sementara truk tangki besar bertindak sebagai FEEDER yang terkunci di jalan arteri utama, menyuplai air melalui selang panjang tanpa menghalangi jalur evakuasi warga."*

### Segmen 4: Modul 3 Sumber Air Terdekat & Uji Stres Luring (`02:30` - `03:40`)
* **Visual:** Relawan beralih ke tab `SUMBER AIR (3 TERDEKAT)`. Muncul 3 hidran dan tandon terurut oleh kalkulasi Haversine lokal. Relawan mengetuk status hidran menjadi `DEBIT RENDAH` dalam 1 ketukan 52 dp.
* **Simulasi Sinyal Mati:** Ponsel dialihkan ke *Airplane Mode*. Status berubah `OFFLINE (1 ANTREAN)`. Relawan menambahkan beberapa mutasi lagi hingga `OFFLINE (4 ANTREAN)`. Aplikasi dimatikan paksa (*force closed*) lalu dibuka kembali — antrean tetap utuh 4! Begitu koneksi dinyalakan kembali, status langsung berkedip `MENYINKRONKAN...` lalu `ONLINE (TERHUBUNG)`.
* **Narasi Voiceover (VO):**  
  > *"Saat suplai air kritis, HydraTact menghitung tiga sumber air terdekat secara luring menggunakan formula Haversine. Status hidran dapat diubah dalam satu ketukan sarung tangan. Bahkan saat sinyal seluler padam total di tengah permukiman padat, seluruh mutasi tersimpan aman di database lokal Isar. Sistem Outbox Worker menjamin nol kehilangan data: begitu armada kembali ke jalan protokol ber-sinyal 4G, seluruh pembaruan otomatis tersinkronisasi secara FIFO."*

### Segmen 5: Hasil Evaluasi SUS & Penutup (`03:40` - `04:20`)
* **Visual:** Dokumentasi foto evaluasi bersama 15 personel relawan Balakarcana Samarinda. Grafik Skor SUS: **83.17 / 100 (Grade A- Excellent)**. Logo tim, Universitas Muhammadiyah Kalimantan Timur (UMKT), dan identitas KMM AST-PTMA 2026.
* **Narasi Voiceover (VO):**  
  > *"Diuji langsung oleh 15 personel relawan Balakarcana Kota Samarinda, HydraTact meraih skor System Usability Scale 83,17 berkategori Excellent. HydraTact membuktikan bahwa koordinasi darurat modern tidak memerlukan perangkat keras mahal, melainkan rekayasa perangkat lunak cerdas yang berakar pada kearifan taktis lokal. HydraTact Samarinda: Tanggap, Taktis, Tuntas."*

---

## 3. Checklist Aset & Logistik Produksi
- [x] Tangkapan layar resolusi tinggi UI Flutter Dark Mode (`#07090E`).
- [x] File `.mbtiles` Samarinda Dense (zoom 14-18) untuk demonstrasi rendering peta vektor luring.
- [x] Perekaman layar PWA Citizen tombol Haptic Press-and-Hold 2.0 detik.
- [x] File audio narasi voiceover berbahasa Indonesia artikulasi jelas & tempo dinamis.
- [x] B-Roll video posko pemadam kebakaran Samarinda dan peralatan nozel portabel.
- [x] Thumbnail YouTube berukuran 1280x720 bebas elemen pill chip / badge lonjong murahan.
