# 09: Perlindungan Rate Limiting & Anti-Abuse Pelaporan

**What to build:** Mekanisme pembatasan laju permintaan pada endpoint publik warga (`POST /api/v1/incidents/report`) menggunakan library `slowapi` (maksimal 3 permintaan per menit per IP) dipadukan dengan validasi header device fingerprint.

**Branch:** `feat/TASK-208-rate-limiting-abuse`

**Blocked by:** 05: Kerangka Peladen REST FastAPI & Koneksi Database

**Status:** ready-for-agent

- [ ] Pengiriman lebih dari 3 kali dalam 1 menit menghasilkan status respons HTTP 429 Too Many Requests.
- [ ] Validasi batas toleransi akurasi GPS ($\le 50\text{ meter}$) menolak laporan dengan sinyal GPS yang tidak presisi.
