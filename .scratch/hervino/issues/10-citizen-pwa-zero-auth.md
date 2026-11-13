# 10: Citizen Emergency PWA (Zero-Auth & GPS Lock)

**What to build:** Aplikasi Web Progresif (PWA) Next.js 14 ringan ($< 150\text{ KB}$) untuk pelaporan darurat warga tanpa login, langsung mengunci koordinat GPS perangkat saat dibuka, serta menampilkan akurasi lokasi dalam meter.

**Branch:** `feat/TASK-302-citizen-pwa-zero-auth`

**Blocked by:** 04: Otomasi Codegen TypeScript & Dart Klien, 05: Kerangka Peladen REST FastAPI & Koneksi Database

**Status:** ready-for-agent

- [ ] Aplikasi meminta izin lokasi saat pertama kali dibuka dan mengunci koordinat `(lat, lng)` dengan akurasi meter.
- [ ] Tampilan antarmuka single-viewport bebas gulir (*zero-scroll*) dengan palet gelap kontras tinggi.
- [ ] Ukuran total aset klien terverifikasi di bawah 150 KB untuk pemuatan cepat di jaringan darurat.
