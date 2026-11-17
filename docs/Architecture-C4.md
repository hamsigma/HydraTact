# Spesifikasi Arsitektur C4 HydraTact Samarinda

> **Dokumen Teknis:** Model Arsitektur Berjenjang (Context, Container, Component)  
> **Target Pengguna:** Relawan Damkar Balakarcana, Operator Posko Induk Disdamkar, Warga Permukiman Padat Samarinda

---

## 1. System Context (Tingkat 1)

Diagram System Context menggambarkan posisi HydraTact di tengah ekosistem penanggulangan kebakaran Kota Samarinda.

```mermaid
flowchart TD
    Warga["Warga Permukiman Padat (Pelapor Cepat)"]
    Posko["Operator Posko Induk (Disdamkar / BPBD)"]
    Relawan["Relawan Balakarcana (Armada Attacker / Feeder)"]

    HydraTact["HydraTact Samarinda Platform"]

    Supabase["Supabase Cloud (PostgreSQL 16 + PostGIS)"]
    OSM["OpenStreetMap Samarinda Extract (MBTiles)"]

    Warga -->|"Lapor Kebakaran Zero-Auth (GPS + Foto)"| HydraTact
    HydraTact -->|"Pembaruan Status Konsensus Waktu Nyata"| Warga

    Posko -->|"Tinjau Antrean Insiden & Manual Override"| HydraTact
    HydraTact -->|"Visualisasi Spasial Taktis & Barikade Selang"| Posko

    Relawan -->|"Kirim Telemetri Tekanan & Status Sumber Air"| HydraTact
    HydraTact -->|"Instruksi Rute Gang & Staging Arteri (Luring)"| Relawan

    HydraTact -->|"Sinkronisasi Data CDC Spasial"| Supabase
    HydraTact -->|"Peta Vektor Jalan & Sungai Karang Mumus"| OSM
```

---

## 2. Container Diagram (Tingkat 2)

Diagram Kontainer memetakan aplikasi mandiri dan penyimpanan data dalam monorepo HydraTact:

```mermaid
flowchart LR
    subgraph Klien["Aplikasi Klien"]
        PWA["PWA Warga (Next.js 15, Zero-Auth, Haptic)"]
        Web["Dasbor Posko Induk (React 19, Leaflet Dark)"]
        Mobile["Klien Mobile Relawan (Flutter, Offline-First)"]
    end

    subgraph Backend["Layanan Backend & Spasial"]
        API["FastAPI Backend Core (Python 3.11, AsyncPG)"]
        Spatial["Spatial Core (Algoritma Haversine & FSM)"]
    end

    subgraph BasisData["Penyimpanan & Sinkronisasi"]
        Postgres["PostgreSQL + PostGIS (3NF DDL, GIST)"]
        Isar["Isar DB (Outbox Queue di HP Relawan)"]
    end

    PWA -->|"HTTPS / REST API"| API
    Web -->|"HTTPS REST + Supabase Realtime"| API
    Mobile -->|"REST saat Daring / Isar saat Luring"| API
    Mobile -->|"Tulis Mutasi Lokal"| Isar

    API --> Spatial
    API -->|"Async Connection Pool"| Postgres
```

---

## 3. Component Diagram: Backend API Core (Tingkat 3)

Komponen internal FastAPI backend yang menangani siklus hidup insiden:

```mermaid
flowchart TD
    Router["API v1 Router (/incidents, /units, /barricades)"]

    Limiter["Rate Limiting Middleware (SlowAPI)"]
    Consensus["Konsensus Geo-fencing (r <= 100m, dt <= 180s)"]
    Dispatcher["Dynamic Role Dispatcher (Auto-Split W_road < 2.5m)"]
    FSM["Incident Lifecycle FSM (Engine Transisi Status)"]
    Exporter["GIS Handover Exporter (GeoJSON & KML)"]

    SpatialRepo["Spatial Repository (PostGIS Queries)"]

    Router --> Limiter
    Limiter --> Consensus
    Consensus --> Dispatcher
    Dispatcher --> FSM
    FSM --> SpatialRepo
    Router --> Exporter
    Exporter --> SpatialRepo
```

---

## 4. Karakteristik Ketahanan Luring (*Offline-First*)

1. **Client-Side Map-Matching Snapping:**
   - Deviasi multipath GPS $\le 25\text{ meter}$ langsung diproyeksikan tegak lurus ke garis tengah gang permukiman tanpa memerlukan panggilan API jaringan.
2. **Outbox Pattern FIFO:**
   - Mutasi status air, permintaan tekanan pompa, dan laporan barikade disimpan di tabel antrean Isar lokal jika jaringan GSM blank spot.
   - Background worker menyinkronkan antrean secara otomatis dengan strategi *Last-Write-Wins* saat sinyal seluler pulih.
