# 01: Inisialisasi Monorepo (pnpm + Turborepo + Python)

**What to build:** Fondasi monorepo terpadu berbasis pnpm workspaces dan Turborepo yang memayungi seluruh aplikasi (`apps/backend-api`, `apps/web-command`, `apps/pwa-citizen`, `apps/mobile-volunteer`) serta paket pustaka (`packages/*`), lengkap dengan isolasi Python virtual environment untuk peladen FastAPI.

**Branch:** `chore/TASK-101-monorepo-setup`

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Berkas `pnpm-workspace.yaml` dan `turbo.json` terkonfigurasi dengan pipeline `build`, `lint`, `test`, `dev`.
- [ ] Struktur direktori `apps/` dan `packages/` terinisialisasi.
- [ ] Skrip inisialisasi lingkungan Python (`apps/backend-api/requirements.txt` / virtualenv) siap dijalankan.
- [ ] Perintah `pnpm run lint` dan `pnpm run build` root berjalan tanpa error.
