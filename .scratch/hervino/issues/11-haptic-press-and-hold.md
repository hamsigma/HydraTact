# 11: Tombol Darurat Haptic Press-and-Hold 2.0 Detik

**What to build:** Komponen tombol darurat lingkaran (diameter 140 dp) pada Citizen PWA yang mewajibkan penahanan jari selama 2.000 ms sebelum laporan dikirim, dilengkapi animasi progres melingkar SVG dan umpan balik getar (Vibration API).

**Branch:** `feat/TASK-303-haptic-press-and-hold`

**Blocked by:** 10: Citizen Emergency PWA (Zero-Auth & GPS Lock)

**Status:** ready-for-agent

- [ ] Penahanan tombol memicu animasi cincin SVG searah jarum jam tepat 2.000 ms.
- [ ] Jari yang terangkat sebelum 2.0 detik membatalkan pengiriman dan mereset animasi seketika.
- [ ] Umpan balik haptic bergetar saat sentuh awal (40 ms) dan konfirmasi berhasil (pola ganda 100-50-150 ms).
