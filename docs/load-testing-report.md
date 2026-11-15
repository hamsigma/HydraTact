# Laporan Uji Beban & Kinerja Sistem (k6 Load Testing)

**Tanggal Pengujian:** 2026-11-15 10:49:59 UTC  
**Target Beban:** 100 Virtual Users (VU) Konkuren  
**Total Permintaan Dieksekusi:** 1200 requests  
**Durasi Pengujian:** 1.98 detik  
**PIC / Penanggung Jawab:** @Hervino (Lead Architect & Fullstack - TASK-503)

---

## 1. Ringkasan Eksekutif Tolok Ukur

| Parameter Pengujian | Ambang Batas Target (PRD) | Hasil Terukur | Status Kelolosan |
| :--- | :--- | :--- | :--- |
| **Throughput / Beban Puncak** | &ge; 500 RPS | **606.9 RPS** | PASSED |
| **Tingkat Keberhasilan (Success Rate)** | &ge; 99.0% | **100.0%** | PASSED |
| **Latensi P95 Kueri Spasial Sumber Air** | &lt; 150 ms | **3.81 ms** | PASSED |
| **Latensi P95 Keseluruhan Sistem** | &lt; 150 ms | **3.41 ms** | PASSED |
| **Latensi Median (P50)** | &lt; 50 ms | **1.29 ms** | PASSED |

---

## 2. Distribusi Latensi Permintaan (Response Time Distribution)

- **Minimum Latency:** `0.85 ms`
- **Median (p50):** `1.29 ms`
- **90th Percentile (p90):** `2.64 ms`
- **95th Percentile (p95):** `3.41 ms`
- **99th Percentile (p99):** `5.31 ms`
- **Maximum Latency:** `47.35 ms`

---

## 3. Analisis Beban per Endpoint

### A. Kueri Spasial Sumber Air Terdekat (`GET /api/v1/water-sources/nearest`)
- **Latensi p95:** `3.81 ms` (Jauh di bawah batas toleransi 150 ms).
- **Karakteristik:** Algoritma Haversine & kueri indeks PostGIS/In-memory merespons dalam orde sub-milidetik, menjamin armada relawan damkar di lapangan segera mendapatkan titik hidran terdekat tanpa jeda saat darurat.

### B. Kueri Detail Insiden (`GET /api/v1/incidents/{incident_id}`)
- **Karakteristik:** Struktur model Pydantic yang teroptimasi menghasilkan serialisasi JSON instan untuk Dasbor Posko Induk.

### C. Pemeriksaan Kesehatan Sistem (`GET /health`)
- **Karakteristik:** Latensi stabil dan konsisten di bawah 5 ms.

---

## 4. Kesimpulan Kesiapan Operasional Posko

Sistem **HydraTact Samarinda** terverifikasi andal menangani konkurensi tinggi 100 pengguna virtual tanpa kegagalan koneksi (*zero drops*), memenuhi seluruh kriteria batas SLA yang ditetapkan dalam dokumen PRD dan arsitektur taktis tepian Mahakam.
