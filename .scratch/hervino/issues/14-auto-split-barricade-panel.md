# 14: Panel Kontrol Auto-Split & Lapisan Garis Barikade Fuchsia

**What to build:** Panel kontrol visual pada Dasbor Komando yang menampilkan daftar armada teralokasi (`ATTACKER` vs `FEEDER`) serta visualisasi garis selang `LineString` warna Fuchsia neon (`#D946EF`) secara real-time via Supabase Realtime.

**Branch:** `feat/TASK-306-auto-split-barricade-panel`

**Blocked by:** 08: Integrasi Saluran Supabase Realtime CDC, 13: Dasbor Komando Posko & Kanvas Peta Gelap Leaflet

**Status:** ready-for-agent

- [ ] Panel armada membedakan visual unit Attacker (aksen merah) dan Feeder (aksen kuning).
- [ ] Penambahan barikade selang baru langsung terlukis sebagai garis neon fuchsia pada peta Leaflet.
- [ ] Operator dapat menonaktifkan barikade dengan satu klik saat selang selesai digulung.
