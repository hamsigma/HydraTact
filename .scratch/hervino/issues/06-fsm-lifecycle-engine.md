# 06: Mesin Siklus Hidup Insiden FSM & Manual Override

**What to build:** Mesin status insiden deterministik (*Finite State Machine*) pada peladen yang mengontrol perpindahan status operasi dari `PENDING_VERIFICATION` hingga `ARCHIVED`, dilengkapi proteksi transisi tidak valid (HTTP 409) dan endpoint `PATCH /api/v1/incidents/{id}/transition` dengan fitur Manual Override posko.

**Branch:** `feat/TASK-204-incident-lifecycle-fsm`

**Blocked by:** 05: Kerangka Peladen REST FastAPI & Koneksi Database

**Status:** ready-for-agent

- [ ] Fungsi murni FSM di `packages/spatial-core/` memvalidasi rantai transisi yang diizinkan.
- [ ] Endpoint `PATCH /api/v1/incidents/{id}/transition` berhasil mengubah status di basis data.
- [ ] Operator posko dapat melakukan Manual Override jika laporan warga hanya berjumlah 1.
