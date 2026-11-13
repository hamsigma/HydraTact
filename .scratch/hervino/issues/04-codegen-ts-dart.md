# 04: Otomasi Codegen TypeScript & Dart Klien

**What to build:** Otomasi pipeline pembangkit tipe data dari kontrak OpenAPI v3 ke antarmuka TypeScript untuk aplikasi web (`apps/web-command` & `apps/pwa-citizen`) serta klien Dio Dart untuk aplikasi mobile (`apps/mobile-volunteer`).

**Branch:** `feat/TASK-104-codegen-ts-dart`

**Blocked by:** 03: Model Pydantic v2 & Ekspor Spesifikasi OpenAPI v3

**Status:** ready-for-agent

- [ ] Perintah `pnpm codegen:web` menghasilkan `apps/web-command/src/types/api.d.ts` tanpa error.
- [ ] Perintah `pnpm codegen:mobile` menghasilkan pustaka klien API Dart lengkap dengan model DTO.
- [ ] Perintah gabungan `pnpm run codegen` di root package.json tereksekusi mulus.
