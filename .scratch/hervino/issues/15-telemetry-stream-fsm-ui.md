# 15: Panel Telemetry Stream & Kontrol Transisi FSM Posko

**What to build:** Panel kontrol siklus hidup insiden bagi operator posko untuk mengeksekusi transisi status FSM (`DISPATCH`, `PENDINGINAN`, `TUTUP INSIDEN`, `MANUAL OVERRIDE`) disertai log telemetri kronologis mutasi lapangan.

**Branch:** `feat/TASK-307-telemetry-stream-fsm-ui`

**Blocked by:** 06: Mesin Siklus Hidup Insiden FSM & Manual Override, 13: Dasbor Komando Posko & Kanvas Peta Gelap Leaflet

**Status:** ready-for-agent

- [ ] Tombol kendali FSM hanya aktif jika transisi valid sesuai aturan deterministik mesin status.
- [ ] Tombol Manual Override tersedia dengan konfirmasi 1-klik jika hanya ada 1 pelapor tunggal.
- [ ] Log mutasi telemetri menampilkan stempel waktu ISO-8601 berurutan dengan tipografi monospace.
