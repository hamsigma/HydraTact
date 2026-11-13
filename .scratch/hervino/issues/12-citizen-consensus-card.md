# 12: Kartu Status Konsensus Realtime Warga

**What to build:** Kartu umpan balik pada Citizen PWA yang terhubung ke saluran Supabase Realtime untuk menampilkan perubahan status dari `MENUNGGU VERIFIKASI` menjadi `TERVERIFIKASI OLEH WARGA SEKITAR` saat konsensus radius 100 meter terpenuhi.

**Branch:** `feat/TASK-304-citizen-consensus-card`

**Blocked by:** 08: Integrasi Saluran Supabase Realtime CDC, 11: Tombol Darurat Haptic Press-and-Hold 2.0 Detik

**Status:** ready-for-agent

- [ ] Klien PWA mendengarkan update baris tabel `incidents` yang cocok dengan ID insiden yang dilaporkan.
- [ ] Tampilan kartu otomatis berganti dari status menunggu ke status terkonfirmasi tanpa reload halaman.
- [ ] Salinan teks bebas pill chips dan menggunakan font monospaced tabular.
