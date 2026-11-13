# 05: Kerangka Peladen REST FastAPI & Koneksi Database

**What to build:** Aplikasi peladen FastAPI asinkron (Python 3.11+) modular dengan router terpisah, penanganan error terpusat, middleware CORS, dan connection pool `asyncpg` ke database Supabase PostGIS.

**Branch:** `feat/TASK-201-fastapi-server-core`

**Blocked by:** 02: Konfigurasi Supabase CLI Local Stack, 03: Model Pydantic v2 & Ekspor Spesifikasi OpenAPI v3

**Status:** ready-for-agent

- [ ] Instance FastAPI aktif dengan dokumentasi interaktif Swagger di `/docs`.
- [ ] Koneksi asinkron `asyncpg` / SQLAlchemy berhasil terhubung ke database Supabase.
- [ ] Endpoint kesehatan sistem `GET /health` mengembalikan status database dan latensi respons.
