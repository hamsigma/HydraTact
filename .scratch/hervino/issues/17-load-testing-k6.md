# 17: Uji Beban & Kinerja Sistem (Load Testing k6)

**What to build:** Skrip pengujian beban sistem otomatis menggunakan k6 atau Artillery yang menguji keandalan endpoint pelaporan warga dan pencarian sumber air terdekat pada 100 permintaan konkuren.

**Branch:** `test/TASK-503-load-testing-k6`

**Blocked by:** 09: Perlindungan Rate Limiting & Anti-Abuse Pelaporan, 16: Pengujian Integrasi Penuh Alur E2E

**Status:** ready-for-agent

- [ ] Skrip k6 terkonfigurasi untuk mensimulasikan 100 pengguna virtual konkuren (VU).
- [ ] Latensi p95 pada endpoint spasial terbukti berada di bawah batas target 150 ms.
- [ ] Laporan hasil pengujian terbit dalam format markdown dan ringkasan eksekutif.
