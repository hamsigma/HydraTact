# 02: Konfigurasi Supabase CLI Local Stack

**What to build:** Lingkungan pengembang lokal Supabase aktif melalui Supabase CLI yang menyediakan PostgreSQL 15/16 + PostGIS 3.4, Supabase Auth, Studio web dashboard, dan Realtime Engine CDC.

**Branch:** `chore/TASK-102-supabase-local-stack`

**Blocked by:** 01: Inisialisasi Monorepo (pnpm + Turborepo + Python)

**Status:** ready-for-agent

- [ ] Berkas konfigurasi `supabase/config.toml` terpasang.
- [ ] Perintah `supabase start` berhasil memunculkan layanan lokal pada port 54321 (API) dan 54323 (Studio).
- [ ] Ekstensi PostGIS terverifikasi aktif pada basis data PostgreSQL lokal.
