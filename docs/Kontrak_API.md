# KONTRAK API & SPESIFIKASI OPENAPI (API CONTRACT)

**Nama Produk:** HydraTact Samarinda  
**Versi API:** `v1.0.0` (MVP Kompetisi KMM AST-PTMA 2026)  
**Sumber Kebenaran Tunggal (*Single Source of Truth*):** `packages/contracts/openapi.yaml`  
**Tim Pengembang:** Hervino Islami Fasha, Ilham Ramadhani, Ariyadi  
**Institusi:** Program Studi Teknik Informatika, Universitas Muhammadiyah Kalimantan Timur (UMKT)

---

## 1. Konvensi Dasar & Protokol Komunikasi

* **Base URL:**
  * Produksi: `https://api.hydratact.id/api/v1`
  * Pengembangan Lokal: `http://localhost:3000/api/v1`
* **Format Pertukaran Data:** `application/json` (UTF-8) dan geometri standar `GeoJSON` dengan sistem koordinat **WGS 84 (SRID 4326)** dalam urutan `[longitude, latitude]`.
* **Format Waktu:** Standar ISO-8601 dengan zona waktu eksplisit (`2026-10-15T20:14:22+08:00` / WITA).
* **Skema Autentikasi:**
  * **Publik Tanpa Login (`CITIZEN`):** Endpoint pelaporan darurat warga tidak menggunakan token sesi agar bebas hambatan saat kondisi panik, namun dilindungi dengan pembatasan laju permintaan (*rate limiting*), validasi durasi tekan tombol, serta klasterisasi koordinat.
  * **Bearer JWT (`COMMANDER`, `VOLUNTEER`):** Wajib menyertakan header `Authorization: Bearer <jwt_token>` yang memuat klaim `user_id`, `role`, `unit_id`, dan `posko_name`.
* **Header Khusus Ketahanan Luring (*Offline-First*):**
  * `X-Idempotency-Key` (UUID v4): Kunci unik per mutasi dari tabel lokal Isar `sync_queue` untuk mencegah duplikasi data apabila koneksi terputus saat pengiriman berlangsung.
  * `X-Client-Timestamp` (ISO-8601): Stempel waktu kejadian riil di perangkat lapangan sebagai dasar penyelesaian konflik *Last-Write-Wins* (mutasi dengan waktu kejadian lapangan terbaru yang dipertahankan, bukan paket yang paling akhir tiba di peladen).

---

## 2. Matriks Endpoint REST API

| Modul | Method | Endpoint | Peran Akses | Fungsi Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Pelaporan Warga** | `POST` | `/incidents/report` | Publik (`CITIZEN`) | Mengirim laporan api terverifikasi GPS & menjalankan konsensus radius $100\text{ m}$. |
| **Komando Insiden** | `GET` | `/incidents/{incident_id}` | `COMMANDER`, `VOLUNTEER` | Mengambil detail insiden aktif, lebar gang, unit teralokasi, dan barikade selang. |
| **Siklus FSM** | `PATCH` | `/incidents/{incident_id}/transition` | `COMMANDER` | Mengubah status operasi (*Finite State Machine*) & memicu *manual override*. |
| **Dispatch Armada** | `POST` | `/incidents/{incident_id}/units/assign` | `VOLUNTEER`, `COMMANDER` | Mendaftarkan unit ke insiden & menghitung otomatis peran `ATTACKER` vs `FEEDER`. |
| **Koordinasi Air** | `POST` | `/units/{unit_id}/pressure-request` | `VOLUNTEER` (`ATTACKER`) | Mengirim sinyal permintaan tekanan pompa air ($5,0\text{ Bar}$) ke unit `FEEDER` terhubung. |
| **Logistik Air** | `GET` | `/water-sources/nearest` | `VOLUNTEER`, `COMMANDER` | Mengambil $N$ sumber air aktif terdekat menggunakan indeks spasial PostGIS `GIST`. |
| **Logistik Air** | `PATCH` | `/water-sources/{source_id}/status` | `VOLUNTEER`, `COMMANDER` | Memperbarui debit air (`READY`, `LOW_DISCHARGE`, `EMPTY`, `DAMAGED`). |
| **Barikade Selang** | `POST` | `/barricades` | `VOLUNTEER`, `COMMANDER` | Menandai ruas jalan tertutup bentangan selang (`GeoJSON LineString`). |
| **Barikade Selang** | `PATCH` | `/barricades/{barricade_id}/deactivate` | `VOLUNTEER`, `COMMANDER` | Membuka kembali akses jalan setelah selang digulung. |
| **Sinkronisasi** | `POST` | `/sync/outbox-batch` | `VOLUNTEER` | Memproses larik mutasi tertunda dari antrean luring Isar DB secara atomik. |

---

## 3. Spesifikasi Detail Request & Response

### 3.1 Pelaporan Darurat Warga (`POST /api/v1/incidents/report`)

Menerima titik koordinat pelapor dan mengevaluasi apakah sudah ada laporan lain dalam radius $r \le 100\text{ meter}$ serta selang waktu $\Delta t \le 3\text{ menit}$.

**Request Body:**
```json
{
  "reporter_phone": "+6281343408542",
  "location": {
    "type": "Point",
    "coordinates": [117.1441, -0.4942]
  },
  "gps_accuracy_meters": 4.2,
  "haptic_hold_duration_ms": 2050,
  "client_timestamp": "2026-10-15T20:00:12+08:00"
}
```

**Response `201 Created` (Konsensus Terpenuhi / Terverifikasi Otomatis):**
```json
{
  "status": "success",
  "data": {
    "incident_id": "8f14e45f-ea9c-4b2a-9c11-202608900001",
    "incident_code": "HT-2026-089",
    "incident_status": "VERIFIED",
    "consensus": {
      "is_verified": true,
      "unique_reporters_count": 3,
      "cluster_radius_meters": 100
    },
    "resolved_address": "Jl. Pelita Gg. 4, RT 12, Kel. Pelita, Samarinda Ilir",
    "detected_road_width_meters": 1.8,
    "nearest_responding_unit": {
      "unit_identifier": "ATK-04",
      "eta_minutes": 3
    }
  }
}
```

---

### 3.2 Transisi Status Operasi FSM (`PATCH /api/v1/incidents/{incident_id}/transition`)

Mengatur perpindahan tahap operasi (*Finite State Machine*) secara deterministik agar tidak melompati prosedur lapangan dan memungkinkan operator posko mengoreksi lebar gang.

**Aturan Transisi Valid:**  
`PENDING_VERIFICATION` $\rightarrow$ `VERIFIED` (atau `CANCELLED_PRANK`) $\rightarrow$ `DISPATCHING` $\rightarrow$ `SUPPRESSION_ACTIVE` $\rightarrow$ `OVERHAUL_COOLING` $\rightarrow$ `INCIDENT_CLOSED` $\rightarrow$ `ARCHIVED`.

**Request Body:**
```json
{
  "target_status": "SUPPRESSION_ACTIVE",
  "road_width_meters": 1.8,
  "override_reason": null,
  "operator_notes": "Unit ATK-04 sudah masuk Gg. 4, FDR-02 siaga di mulut jalan."
}
```

**Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "incident_id": "8f14e45f-ea9c-4b2a-9c11-202608900001",
    "previous_status": "DISPATCHING",
    "current_status": "SUPPRESSION_ACTIVE",
    "dispatch_protocol": "AUTO_SPLIT_NARROW_ALLEY",
    "updated_at": "2026-10-15T20:06:00+08:00"
  }
}
```

---

### 3.3 Alokasi Peran Armada Otomatis (`POST /api/v1/incidents/{incident_id}/units/assign`)

Mengeksekusi algoritma *Dynamic Role Dispatching* berdasarkan parameter lebar jalan masuk ($W_{\text{road}}$) dan kapasitas tangki kendaraan ($C(U_i)$).

**Request Body:**
```json
{
  "unit_identifier": "FDR-02",
  "posko_name": "Balakarcana Posko 02",
  "vehicle_type": "LARGE_TANK",
  "water_capacity_liters": 5000,
  "current_location": {
    "type": "Point",
    "coordinates": [117.1438, -0.4945]
  }
}
```

**Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "unit_id": "3c99a12b-77d1-4a10-8e21-000000000002",
    "unit_identifier": "FDR-02",
    "assigned_role": "FEEDER",
    "dispatch_rationale": "Lebar gang 1.8m (< 2.5m) dan kapasitas tangki 5000L (>= 3000L). Dilarang masuk gang.",
    "tactical_instruction": "Berhenti di Jl. Pelita (jalan utama). Sambungkan selang suplai ke unit ATK-04 di mulut gang.",
    "paired_unit": "ATK-04"
  }
}
```

---

### 3.4 Pencarian Sumber Air Terdekat (`GET /api/v1/water-sources/nearest`)

**Query Parameters:**
* `lat` (wajib, float): `-0.4945`
* `lng` (wajib, float): `117.1438`
* `limit` (opsional, integer, default `3`): `3`
* `include_low_discharge` (opsional, boolean, default `true`): `true`

**Response `200 OK`:**
```json
{
  "status": "success",
  "data": [
    {
      "source_id": "a1111111-1111-4111-8111-111111111101",
      "code": "HYD-PLT-04",
      "name": "Hidran PDAM Jl. Pelita",
      "source_type": "PDAM_HYDRANT",
      "status": "READY",
      "pressure_bar": 5.0,
      "capacity_liters": null,
      "distance_meters": 95,
      "estimated_travel_minutes": 1.2,
      "location": {
        "type": "Point",
        "coordinates": [117.1436, -0.4948]
      },
      "last_verified_at": "2026-10-15T20:09:00+08:00"
    },
    {
      "source_id": "a1111111-1111-4111-8111-111111111102",
      "code": "TND-RT14-01",
      "name": "Tandon Masjid RT 14",
      "source_type": "COMMUNITY_TOWER",
      "status": "READY",
      "pressure_bar": null,
      "capacity_liters": 5000,
      "distance_meters": 140,
      "estimated_travel_minutes": 2.0,
      "location": {
        "type": "Point",
        "coordinates": [117.1451, -0.4939]
      },
      "last_verified_at": "2026-10-15T20:05:00+08:00"
    }
  ]
}
```

---

### 3.5 Pembaruan Status Sumber Air (`PATCH /api/v1/water-sources/{source_id}/status`)

**Headers:**
* `X-Idempotency-Key: 9b2c1d44-1122-4333-8444-555566667777`
* `X-Client-Timestamp: 2026-10-15T20:13:12+08:00`

**Request Body:**
```json
{
  "status": "READY",
  "pressure_bar": 5.0,
  "reported_by_unit": "FDR-02",
  "notes": "Debit deras, selang isap 2.5 inci terpasang."
}
```

**Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "source_id": "a1111111-1111-4111-8111-111111111101",
    "code": "HYD-PLT-04",
    "status": "READY",
    "pressure_bar": 5.0,
    "effective_timestamp": "2026-10-15T20:13:12+08:00"
  }
}
```

---

### 3.6 Penandaan Barikade Selang Jalan (`POST /api/v1/barricades`)

**Request Body:**
```json
{
  "incident_id": "8f14e45f-ea9c-4b2a-9c11-202608900001",
  "road_name": "Mulut Jl. Pelita Gg. 4",
  "reason": "HOSE_CONNECTED",
  "hose_length_meters": 110,
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [117.1438, -0.4945],
      [117.1440, -0.4944],
      [117.1441, -0.4942]
    ]
  }
}
```

**Response `201 Created`:**
```json
{
  "status": "success",
  "data": {
    "barricade_id": "b7777777-2222-4222-8222-222222222201",
    "road_name": "Mulut Jl. Pelita Gg. 4",
    "hose_length_meters": 110,
    "is_active": true,
    "created_at": "2026-10-15T20:13:40+08:00"
  }
}
```

---

### 3.7 Sinkronisasi Antrean Luring Batch (`POST /api/v1/sync/outbox-batch`)

Menerima seluruh mutasi yang tertahan di perangkat relawan saat terjadi *blank spot* (hilang sinyal seluler) dan memprosesnya secara berurutan (FIFO).

**Request Body:**
```json
{
  "device_id": "android-unit-atk04",
  "unit_identifier": "ATK-04",
  "mutations": [
    {
      "mutation_uuid": "mut-084-uuid-v4",
      "operation": "UPDATE_WATER_STATUS",
      "target_id": "a1111111-1111-4111-8111-111111111101",
      "client_timestamp": "2026-10-15T20:13:12+08:00",
      "payload": {
        "status": "READY",
        "pressure_bar": 5.0
      }
    },
    {
      "mutation_uuid": "mut-085-uuid-v4",
      "operation": "CREATE_BARRICADE",
      "target_id": "8f14e45f-ea9c-4b2a-9c11-202608900001",
      "client_timestamp": "2026-10-15T20:13:40+08:00",
      "payload": {
        "road_name": "Jl. Pelita Gg. 4",
        "hose_length_meters": 110,
        "geometry": {
          "type": "LineString",
          "coordinates": [[117.1438, -0.4945], [117.1441, -0.4942]]
        }
      }
    },
    {
      "mutation_uuid": "mut-086-uuid-v4",
      "operation": "UNIT_TELEMETRY_UPDATE",
      "target_id": "3c99a12b-77d1-4a10-8e21-000000000001",
      "client_timestamp": "2026-10-15T20:14:02+08:00",
      "payload": {
        "coordinates": [117.1441, -0.4942],
        "fire_distance_meters": 35,
        "pump_active": true
      }
    }
  ]
}
```

**Response `200 OK`:**
```json
{
  "status": "success",
  "data": {
    "batch_processed_count": 3,
    "results": [
      {
        "mutation_uuid": "mut-084-uuid-v4",
        "sync_status": "APPLIED"
      },
      {
        "mutation_uuid": "mut-085-uuid-v4",
        "sync_status": "APPLIED"
      },
      {
        "mutation_uuid": "mut-086-uuid-v4",
        "sync_status": "STALE_IGNORED",
        "reason": "Peladen sudah memiliki pembaruan lebih baru dari klien lain (20:14:05+08:00)."
      }
    ]
  }
}
```

---

## 4. Kontrak Event Real-Time (WebSocket `/ws/v1/tactical`)

Klien web komando dan ponsel relawan berlangganan pada saluran insiden `incident:{incident_id}` untuk menerima pembaruan seketika saat terhubung jaringan:

| Nama Event | Pengirim | Penerima | Muatan Payload Ringkas |
| :--- | :--- | :--- | :--- |
| `incident.verified` | Server | Semua Posko & Komando | `incident_id`, `coordinates`, `road_width_meters`, `status` |
| `unit.role_assigned` | Server | Unit Terkait & Komando | `unit_identifier`, `assigned_role` (`ATTACKER` / `FEEDER`), `paired_unit` |
| `unit.pressure_requested` | `ATTACKER` | `FEEDER` & Komando | `from_unit`, `to_unit`, `target_bar` ($5,0$), `timestamp` |
| `water_source.updated` | Server | Semua Unit & Komando | `source_id`, `code`, `status`, `pressure_bar`, `updated_by` |
| `barricade.updated` | Server | Semua Unit & Komando | `barricade_id`, `is_active`, `geometry` (`LineString`) |

---

## 5. Standar Penanganan Error HTTP

Seluruh respons gagal mengikuti struktur seragam berikut:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_FSM_TRANSITION",
    "message": "Tidak dapat memindahkan status langsung dari VERIFIED ke INCIDENT_CLOSED tanpa melalui SUPPRESSION_ACTIVE.",
    "details": {
      "current_status": "VERIFIED",
      "allowed_next_statuses": ["DISPATCHING", "CANCELLED_PRANK"]
    }
  }
}
```

| HTTP Status | Kode Error | Penyebab Teknis |
| :--- | :--- | :--- |
| `400 Bad Request` | `INVALID_GEOJSON_COORDINATES` | Koordinat di luar batas wilayah Kota Samarinda atau urutan `[lng, lat]` terbalik. |
| `401 Unauthorized` | `TOKEN_EXPIRED_OR_MISSING` | Token JWT tidak ditemukan atau telah kedaluwarsa. |
| `403 Forbidden` | `INSUFFICIENT_ROLE_PERMISSION` | Akun peran `VOLUNTEER` mencoba mengakses endpoint khusus `COMMANDER`. |
| `409 Conflict` | `INVALID_FSM_TRANSITION` | Percobaan melompati urutan status operasi insiden pada mesin FSM. |
| `422 Unprocessable Entity` | `HAPTIC_HOLD_TOO_SHORT` | Durasi tekan tombol warga kurang dari ambang minimum $2000\text{ ms}$. |
| `429 Too Many Requests` | `REPORT_RATE_LIMIT_EXCEEDED` | Nomor telepon/perangkat mengirim lebih dari $3$ laporan dalam selang waktu $5\text{ menit}$. |

---

## 6. Spesifikasi OpenAPI 3.1.0 (`packages/contracts/openapi.yaml`)

Skema berikut merupakan definisi siap pakai untuk menghasilkan tipe data TypeScript dan kelas klien Dart secara otomatis:

```yaml
openapi: 3.1.0
info:
  title: HydraTact Samarinda Tactical Coordination API
  version: 1.0.0
  description: Kontrak API terpadu untuk Dasbor Komando Web, Klien Mobile Offline-First, dan PWA Warga.
servers:
  - url: https://api.hydratact.id/api/v1
    description: Production Server
  - url: http://localhost:3000/api/v1
    description: Local Development Monorepo

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    GeoPoint:
      type: object
      required: [type, coordinates]
      properties:
        type:
          type: string
          const: Point
        coordinates:
          type: array
          minItems: 2
          maxItems: 2
          items:
            type: number
          description: "[longitude, latitude] dalam WGS 84 (SRID 4326)"

    GeoLineString:
      type: object
      required: [type, coordinates]
      properties:
        type:
          type: string
          const: LineString
        coordinates:
          type: array
          minItems: 2
          items:
            type: array
            minItems: 2
            maxItems: 2
            items:
              type: number

    IncidentStatus:
      type: string
      enum:
        - PENDING_VERIFICATION
        - VERIFIED
        - DISPATCHING
        - SUPPRESSION_ACTIVE
        - OVERHAUL_COOLING
        - INCIDENT_CLOSED
        - ARCHIVED
        - CANCELLED_PRANK

    VehicleType:
      type: string
      enum:
        - LARGE_TANK
        - MEDIUM_TANK
        - THREE_WHEELER
        - PORTABLE_PUMP

    TacticalRole:
      type: string
      enum:
        - ATTACKER
        - FEEDER
        - RESERVE_FEEDER
        - DIRECT_ATTACK
        - UNASSIGNED

    WaterStatus:
      type: string
      enum:
        - READY
        - LOW_DISCHARGE
        - EMPTY
        - DAMAGED

    CitizenReportRequest:
      type: object
      required: [reporter_phone, location, gps_accuracy_meters, haptic_hold_duration_ms, client_timestamp]
      properties:
        reporter_phone:
          type: string
          example: "+6281343408542"
        location:
          $ref: "#/components/schemas/GeoPoint"
        gps_accuracy_meters:
          type: number
          minimum: 0
        haptic_hold_duration_ms:
          type: integer
          minimum: 2000
        client_timestamp:
          type: string
          format: date-time

    OutboxMutationItem:
      type: object
      required: [mutation_uuid, operation, target_id, client_timestamp, payload]
      properties:
        mutation_uuid:
          type: string
          format: uuid
        operation:
          type: string
          enum: [UPDATE_WATER_STATUS, CREATE_BARRICADE, DEACTIVATE_BARRICADE, UNIT_TELEMETRY_UPDATE]
        target_id:
          type: string
          format: uuid
        client_timestamp:
          type: string
          format: date-time
        payload:
          type: object
          additionalProperties: true

paths:
  /incidents/report:
    post:
      summary: Kirim laporan darurat warga dan jalankan evaluasi konsensus spasial
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CitizenReportRequest"
      responses:
        "201":
          description: Laporan tercatat dan dievaluasi oleh mesin konsensus
        "422":
          description: Durasi sentuhan tertahan tidak memenuhi batas 2000ms

  /incidents/{incident_id}/transition:
    patch:
      summary: Transisi siklus hidup insiden (FSM) oleh operator posko
      security:
        - BearerAuth: []
      parameters:
        - name: incident_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [target_status]
              properties:
                target_status:
                  $ref: "#/components/schemas/IncidentStatus"
                road_width_meters:
                  type: number
                override_reason:
                  type: [string, "null"]
                operator_notes:
                  type: string
      responses:
        "200":
          description: Status insiden diperbarui
        "409":
          description: Transisi FSM tidak diizinkan

  /incidents/{incident_id}/units/assign:
    post:
      summary: Daftarkan armada dan hitung peran otomatis (Dynamic Role Dispatching)
      security:
        - BearerAuth: []
      parameters:
        - name: incident_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [unit_identifier, posko_name, vehicle_type, water_capacity_liters, current_location]
              properties:
                unit_identifier:
                  type: string
                posko_name:
                  type: string
                vehicle_type:
                  $ref: "#/components/schemas/VehicleType"
                water_capacity_liters:
                  type: integer
                current_location:
                  $ref: "#/components/schemas/GeoPoint"
      responses:
        "200":
          description: Peran taktis berhasil ditetapkan

  /water-sources/nearest:
    get:
      summary: Cari sumber air aktif terdekat menggunakan indeks PostGIS GIST
      security:
        - BearerAuth: []
      parameters:
        - name: lat
          in: query
          required: true
          schema:
            type: number
        - name: lng
          in: query
          required: true
          schema:
            type: number
        - name: limit
          in: query
          schema:
            type: integer
            default: 3
      responses:
        "200":
          description: Daftar sumber air diurutkan dari jarak terdekat

  /water-sources/{source_id}/status:
    patch:
      summary: Pembaruan 1-ketukan status debit air
      security:
        - BearerAuth: []
      parameters:
        - name: source_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status:
                  $ref: "#/components/schemas/WaterStatus"
                pressure_bar:
                  type: number
                reported_by_unit:
                  type: string
      responses:
        "200":
          description: Status sumber air berhasil diperbarui

  /barricades:
    post:
      summary: Tandai barikade bentangan selang pada ruas jalan
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [incident_id, road_name, reason, hose_length_meters, geometry]
              properties:
                incident_id:
                  type: string
                  format: uuid
                road_name:
                  type: string
                reason:
                  type: string
                  enum: [HOSE_CONNECTED, FIRE_SPREAD, COLLAPSED_DEBRIS]
                hose_length_meters:
                  type: integer
                geometry:
                  $ref: "#/components/schemas/GeoLineString"
      responses:
        "201":
          description: Barikade selang aktif pada peta

  /sync/outbox-batch:
    post:
      summary: Sinkronisasi massal mutasi tertunda dari Isar DB saat koneksi pulih
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [device_id, unit_identifier, mutations]
              properties:
                device_id:
                  type: string
                unit_identifier:
                  type: string
                mutations:
                  type: array
                  items:
                    $ref: "#/components/schemas/OutboxMutationItem"
      responses:
        "200":
          description: Hasil pemrosesan batch mutasi luring
```

---

## 7. Otomasi Codegen pada Monorepo

Untuk memastikan tidak ada perbedaan struktur atribut antara aplikasi web Next.js dan aplikasi seluler Flutter, jalankan skrip pembangkit kode otomatis pada berkas `package.json` akar monorepo:

```json
{
  "scripts": {
    "codegen:web": "openapi-typescript packages/contracts/openapi.yaml -o apps/web/src/types/api.d.ts",
    "codegen:mobile": "openapi-generator-cli generate -i packages/contracts/openapi.yaml -g dart-dio -o apps/mobile/packages/api_client",
    "codegen": "pnpm codegen:web && pnpm codegen:mobile"
  }
}
```