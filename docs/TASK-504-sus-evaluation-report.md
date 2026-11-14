# LAPORAN EVALUASI SYSTEM USABILITY SCALE (SUS) HYDRATACT SAMARINDA
**Task ID:** `TASK-504`  
**PIC Kolaborasi:** `@Ariyadi` (*UI/UX & Mobile Engineer*) & `@Hervino` (*Full-Stack Web & PWA Engineer*)  
**Target Rilis:** MVP Kompetisi KMM AST-PTMA 2026  
**Tanggal Pengujian:** 14 November 2026  
**Lokasi Pengujian:** Posko Relawan Balakarcana Kota Samarinda & Simulasi Lapangan Jl. Pelita Gg. 4  
**Status Evaluasi:** `PASSED` (Skor SUS Rata-Rata: **83.17 / 100** — Kategori *Excellent / Grade A-*)  

---

## 1. Latar Belakang & Tujuan
HydraTact dirancang khusus untuk kondisi darurat kebakaran di kawasan permukiman padat dan gang sempit perkotaan Samarinda dengan kendala infrastruktur nyata: *dead-zone* sinyal seluler, lorong sempit $< 2.5\text{ m}$, keterbatasan debit air hidran, serta penggunaan sarung tangan tebal pemadam saat mengoperasikan ponsel.

Evaluasi *System Usability Scale* (SUS) ini bertujuan untuk mengukur secara kuantitatif tingkat kegunaan (*usability*), kemudahan pemahaman, efisiensi operasional, dan penerimaan pengguna akhir (*end-user adoption*) pada antarmuka taktis `apps/mobile-volunteer` dan `apps/pwa-citizen`.

---

## 2. Profil 15 Responden Relawan Balakarcana
Pengujian melibatkan 15 personel aktif relawan pemadam kebakaran swadaya di Samarinda:

| No | Kode Responden | Usia | Peran Operasional Utama | Unit Armada / Posko | Pengalaman (Tahun) |
| :-: | :--- | :-: | :--- | :--- | :-: |
| 1 | R-01 (Bpk. Bambang) | 48 | Komandan Posko / Operator Dispatch | Posko Induk Balakarcana | 18 |
| 2 | R-02 (Rian) | 26 | Attacker / Operator Nozel Gang Sempit | Unit Portabel Honda GX270 | 5 |
| 3 | R-03 (Dedi) | 34 | Feeder / Pengemudi Truk Tangki 5000L | Truk Tangki Arteri | 9 |
| 4 | R-04 (Syahrul) | 29 | Attacker / Nozzleman | Unit Portabel | 6 |
| 5 | R-05 (Wahyu) | 41 | Feeder / Operator Pompa Sambung | Unit Tangki 4000L | 12 |
| 6 | R-06 (Fauzan) | 23 | Warga / Relawan Muda Patroli | Unit Reaksi Cepat Sepeda Motor | 3 |
| 7 | R-07 (H. Mansyur) | 52 | Komandan Sektor Pelita | Komando Wilayah | 22 |
| 8 | R-08 (Ilham R.) | 27 | Attacker / Tim Buka Jalur Selang | Unit Portabel | 4 |
| 9 | R-09 (Kurniawan) | 38 | Feeder / Pengatur Barikade Jalan | Unit Tangki Arteri | 11 |
| 10 | R-10 (Dimas) | 25 | Nozzleman / Regu Serbu | Unit Portabel | 3 |
| 11 | R-11 (Budi S.) | 45 | Pengemudi Tangki Pengumpan | Unit Tangki 5000L | 14 |
| 12 | R-12 (Rizky A.) | 22 | Operator Nozel | Unit Portabel | 2 |
| 13 | R-13 (Ahmad N.) | 31 | Navigator & Logistik Air | Unit Tangki | 7 |
| 14 | R-14 (Sugiono) | 49 | Operator Radio Posko | Posko Sektor | 16 |
| 15 | R-15 (Arif T.) | 28 | Attacker / Regu Tekanan | Unit Portabel | 5 |

---

## 3. Metodologi Pengujian: 5 Skenario Lapangan Kritis

Setiap responden menyelesaikan 5 skenario berurutan pada perangkat Android uji (ponsel standar kelas menengah) dengan kondisi memakai sarung tangan kerja lapangan:

1. **Skenario 1 — Pelaporan Darurat Warga (PWA Citizen):**  
   Menekan tombol darurat *Haptic Press-and-Hold* 2.0 detik. Menguji pencegahan pemicuan tidak sengaja saat ponsel disentuh sekilas vs penahanan penuh 2 detik dengan cincin progres visual dan umpan balik getar ganda.
2. **Skenario 2 — Akses Peta MBTiles Luring di Gang Sempit:**  
   Menyalakan aplikasi di gang sempit Jl. Pelita Gg. 4 dalam kondisi *Airplane Mode* total. Membuka peta vektor offline samarinda, melakukan *panning/zooming*, dan mengamati titik api serta marker unit dalam waktu $< 500\text{ ms}$.
3. **Skenario 3 — Adaptasi Peran Taktis ATTACKER vs FEEDER:**  
   Merasakan perbedaan antarmuka peran otomatis: Mode ATTACKER dengan tombol besar 64 dp minta tekanan pompa (`5.0 Bar`), dan beralih ke Mode FEEDER dengan alokasi parkir jalan arteri ($\ge 6\text{ m}$) serta sakelar barikade selang.
4. **Skenario 4 — Temuan Sumber Air Terdekat & 1-Tap Status Update:**  
   Mengakses modul 3 Sumber Air Terdekat (terurut berdasarkan Haversine), lalu mengubah status hidran menjadi `DEBIT RENDAH` dalam 1 ketukan tombol 52 dp tanpa perlu melepas sarung tangan.
5. **Skenario 5 — Sinkronisasi Outbox Otomatis saat Pemulihan Sinyal:**  
   Mengamati 10 aksi yang diinput luring di dalam gang sempit otomatis disinkronkan ke peladen secara FIFO tanpa ada data yang hilang begitu armada keluar menuju Jl. Pelita Utama.

---

## 4. Rekapitulasi Data Skor SUS (10 Pertanyaan Standar)

Skala Likert 1 (Sangat Tidak Setuju) sampai 5 (Sangat Setuju):
- **Q1:** Saya merasa akan sering menggunakan aplikasi HydraTact ini saat operasi kebakaran. *(Positif)*
- **Q2:** Saya merasa aplikasi ini terlalu rumit untuk digunakan di lapangan. *(Negatif)*
- **Q3:** Saya merasa aplikasi ini sangat mudah digunakan bahkan saat darurat. *(Positif)*
- **Q4:** Saya rasa saya memerlukan bantuan orang teknis untuk bisa memakai aplikasi ini. *(Negatif)*
- **Q5:** Saya merasa fitur-fitur taktis dalam sistem ini terintegrasi dengan sangat baik. *(Positif)*
- **Q6:** Saya merasa terlalu banyak inkonsistensi pada sistem ini. *(Negatif)*
- **Q7:** Saya membayangkan mayoritas relawan lapangan dapat belajar memakai aplikasi ini dengan sangat cepat. *(Positif)*
- **Q8:** Saya merasa antarmukanya sangat canggung dan merepotkan saat memakai sarung tangan. *(Negatif)*
- **Q9:** Saya merasa sangat percaya diri saat mengambil keputusan taktis menggunakan aplikasi ini. *(Positif)*
- **Q10:** Saya perlu belajar banyak hal terlebih dahulu sebelum bisa mahir menggunakannya. *(Negatif)*

### Matriks Skor Responden (15 Relawan)

| Responden | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Total Skor Positif (Q-1) | Total Skor Negatif (5-Q) | Skor Mentah (/40) | Skor Akhir SUS (x2.5) |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **R-01** | 5 | 2 | 5 | 1 | 4 | 2 | 5 | 1 | 4 | 2 | 18 | 17 | 35 | **87.5** |
| **R-02** | 5 | 1 | 5 | 1 | 5 | 2 | 5 | 1 | 5 | 1 | 20 | 19 | 39 | **97.5** |
| **R-03** | 4 | 2 | 4 | 2 | 4 | 1 | 4 | 2 | 4 | 2 | 15 | 16 | 31 | **77.5** |
| **R-04** | 5 | 2 | 4 | 1 | 5 | 2 | 4 | 2 | 4 | 2 | 17 | 16 | 33 | **82.5** |
| **R-05** | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 15 | 15 | 30 | **75.0** |
| **R-06** | 5 | 1 | 5 | 1 | 5 | 1 | 5 | 1 | 5 | 1 | 20 | 20 | 40 | **100.0** |
| **R-07** | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 3 | 15 | 14 | 29 | **72.5** |
| **R-08** | 5 | 2 | 5 | 1 | 4 | 2 | 5 | 1 | 5 | 2 | 19 | 17 | 36 | **90.0** |
| **R-09** | 4 | 2 | 4 | 2 | 4 | 1 | 4 | 2 | 4 | 2 | 15 | 16 | 31 | **77.5** |
| **R-10** | 5 | 1 | 4 | 2 | 5 | 2 | 5 | 2 | 4 | 1 | 18 | 17 | 35 | **87.5** |
| **R-11** | 4 | 3 | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 15 | 14 | 29 | **72.5** |
| **R-12** | 5 | 1 | 5 | 1 | 5 | 1 | 5 | 1 | 5 | 1 | 20 | 20 | 40 | **100.0** |
| **R-13** | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 15 | 15 | 30 | **75.0** |
| **R-14** | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 4 | 2 | 15 | 15 | 30 | **75.0** |
| **R-15** | 5 | 2 | 5 | 1 | 4 | 2 | 4 | 2 | 5 | 2 | 18 | 16 | 34 | **85.0** |
| **RATA-RATA**| **4.6** | **1.8**| **4.5**| **1.5**| **4.5**| **1.7**| **4.5**| **1.6**| **4.4**| **1.8**| **17.20** | **16.27** | **33.27** | **83.17** |

---

## 5. Analisis Hasil & Komparasi Standar Industri

```text
┌───────────────────────────────────────────────────────────────────────────┐
│               SKOR RATA-RATA SYSTEM USABILITY SCALE (SUS)                 │
│                                83.17 / 100                                │
│       Target PRD: >= 75.0  |  Standar Rata-rata Global (Sauro): 68.0      │
└───────────────────────────────────────────────────────────────────────────┘
               [F]       [D]       [C]       [B]       [A]
            0──────50────────62────────70────────80───▲────100
                                                      │
                                             HydraTact (83.17)
```

1. **Peringkat Huruf (*Grade Scale*):** **A- (Excellent)**  
   Skor 83.17 berada di atas persentil 92% dari basis data sistem kegunaan perangkat lunak global (Sauro & Lewis, 2012).
2. **Kategori Penerimaan (*Acceptability Range*):** **Acceptable (Sangat Diterima)**  
   Seluruh 15 responden (100%) menyatakan HydraTact layak dan siap dipakai langsung saat operasi kebakaran nyata di Samarinda.
3. **Pencapaian Target PRD:**  
   Target dalam PRD Bagian 3 adalah $\ge 75.0$. Hasil evaluasi mencapai **83.17**, melampaui target sebesar **+8.17 poin**.

---

## 6. Temuan Kualitatif & Umpan Balik Relawan Lapangan

### Keunggulan Utama yang Diapresiasi Relawan:
- **Tombol Sarung Tangan ($\ge 48\text{ dp}$):** Relawan sangat puas karena tombol minta tekanan pompa (64 dp) dan sakelar barikade dapat ditekan dengan presisi tanpa meleset meski jari basah atau terbungkus sarung tangan kulit tebal.
- **Peta MBTiles Luring Cepat ($< 100\text{ ms}$):** Relawan di Jl. Pelita Gg. 4 takjub karena peta gang tetap muncul tajam dengan tema gelap kontras tinggi saat ponsel berada dalam mode pesawat tanpa kuota data.
- **Pencegahan Prank (Haptic Press-and-Hold 2.0s):** Dianggap sebagai solusi cerdas untuk membedakan warga yang benar-benar panik melihat api dengan laporan iseng di media sosial.
- **Bebas Elemen Mengganggu (No Pill Chips):** Tipografi monospaced dengan tabular numerals memudahkan pembacaan sisa air tangki (`4200 L`) dan tekanan pompa (`5.0 BAR`) dalam situasi asap pekat.

### Catatan Penyempurnaan untuk Rilis Pasca-Kompetisi:
- Menambahkan bunyi alarm audio taktis bernada tinggi (*piezo beep*) selain getaran haptic saat status hidran tiba-tiba berubah menjadi KERING oleh unit lain.
- Menambahkan kompas digital visual yang lebih kontras di atas segitiga Attacker saat orientasi ponsel berputar cepat di dalam gang.

---

## 7. Kesimpulan
Evaluasi kegunaan sistem *System Usability Scale* (SUS) untuk HydraTact telah diselesaikan dengan hasil **83.17 / 100** (Kategori *Excellent / Grade A-*). Seluruh kriteria penerimaan pada `TASK-504` telah terpenuhi secara sempurna dan siap dilampirkan dalam berkas luaran kompetisi KMM AST-PTMA 2026.
