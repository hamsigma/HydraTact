# 16: Pengujian Integrasi Penuh Alur E2E

**What to build:** Verifikasi terpadu skenario end-to-end tanpa cela dari pelaporan warga melalui Citizen PWA, konsensus spasial di FastAPI, penerimaan alarm dan pemisahan peran armada di Dasbor Posko, hingga pemutakhiran status luring pada aplikasi Flutter.

**Branch:** `feat/TASK-408-e2e-integration-flow`

**Blocked by:** 11: Tombol Darurat Haptic Press-and-Hold 2.0 Detik, 14: Panel Kontrol Auto-Split & Lapisan Garis Barikade Fuchsia, 15: Panel Telemetry Stream & Kontrol Transisi FSM Posko

**Status:** ready-for-agent

- [ ] Skenario simulasi Jl. Pelita Gg. 4 berhasil dijalankan secara terpadu lintas peramban dan perangkat mobile.
- [ ] Waktu tanggap sistem dari penahanan tombol warga hingga alarm posko tercatat di bawah 2 detik.
- [ ] Seluruh data mutasi tersimpan dan terverifikasi di basis data Supabase PostGIS.
