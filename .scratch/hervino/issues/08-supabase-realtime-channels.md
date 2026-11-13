# 08: Integrasi Saluran Supabase Realtime CDC

**What to build:** Konfigurasi saluran WebSocket Supabase Realtime untuk menyiarkan perubahan baris tabel (`road_barricades`, `incident_units`, `water_sources`, `incidents`) langsung ke klien aktif tanpa perantara broker tambahan.

**Branch:** `feat/TASK-207-supabase-realtime-channels`

**Blocked by:** 02: Konfigurasi Supabase CLI Local Stack, 05: Kerangka Peladen REST FastAPI & Koneksi Database

**Status:** ready-for-agent

- [ ] Publikasi replikasi `supabase_realtime` aktif dengan *full replica identity*.
- [ ] Tes klien JavaScript/TypeScript menerima event saat data barikade baru di-insert.
- [ ] Filter event CDC terisolasi per status insiden aktif.
