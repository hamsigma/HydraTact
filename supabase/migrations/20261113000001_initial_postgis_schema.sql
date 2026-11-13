-- =============================================================================
-- HydraTact Samarinda - Initial PostGIS Schema & Realtime CDC Migration
-- File: 20261113000001_initial_postgis_schema.sql
-- Single Source of Truth: docs/Database.md
-- =============================================================================

-- 1. Ekstensi Basis Data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Domain & Tipe Enumerasi (ENUM)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_fsm_status') THEN
        CREATE TYPE incident_fsm_status AS ENUM (
            'PENDING_VERIFICATION',
            'VERIFIED',
            'DISPATCHING',
            'SUPPRESSION_ACTIVE',
            'OVERHAUL_COOLING',
            'INCIDENT_CLOSED',
            'ARCHIVED',
            'CANCELLED_PRANK'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_system_role') THEN
        CREATE TYPE user_system_role AS ENUM (
            'COMMANDER',
            'VOLUNTEER_ATTACKER',
            'VOLUNTEER_FEEDER',
            'CITIZEN'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fleet_vehicle_type') THEN
        CREATE TYPE fleet_vehicle_type AS ENUM (
            'TANKER_TRUCK',
            'PICKUP_SKID',
            'THREE_WHEELER_TOSSA',
            'PORTABLE_PUMP_SQUAD'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tactical_unit_role') THEN
        CREATE TYPE tactical_unit_role AS ENUM (
            'ATTACKER',
            'FEEDER',
            'RESERVE_FEEDER',
            'DIRECT_ATTACK',
            'UNASSIGNED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'water_source_category') THEN
        CREATE TYPE water_source_category AS ENUM (
            'PDAM_HYDRANT',
            'COMMUNITY_TOWER',
            'RIVER_TIDAL_DOCK',
            'RETENTION_POND'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'water_operational_status') THEN
        CREATE TYPE water_operational_status AS ENUM (
            'READY',
            'LOW_DISCHARGE',
            'EMPTY',
            'DAMAGED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'barricade_reason_type') THEN
        CREATE TYPE barricade_reason_type AS ENUM (
            'PRESSURIZED_HOSE_LINE',
            'FEEDER_STAGING_ZONE',
            'COLLAPSE_HAZARD',
            'HOSE_CONNECTED',
            'FIRE_SPREAD',
            'COLLAPSED_DEBRIS',
            'ACCESS_LOCKED'
        );
    END IF;
END $$;

-- 3. Tabel Posko Stasiun Relawan
CREATE TABLE IF NOT EXISTS posko_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    district VARCHAR(80) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    radio_channel VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posko_location ON posko_stations USING GIST (location);

-- 4. Tabel Pengguna (Komando & Relawan)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    posko_id UUID REFERENCES posko_stations(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    system_role user_system_role NOT NULL DEFAULT 'VOLUNTEER_ATTACKER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_posko ON users(posko_id);

-- 5. Tabel Insiden Kebakaran
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_code VARCHAR(30) UNIQUE,
    street_address TEXT NOT NULL,
    epicenter GEOGRAPHY(Point, 4326) NOT NULL,
    road_width_meters NUMERIC(4, 2) NOT NULL DEFAULT 2.00 CHECK (road_width_meters > 0),
    fsm_status incident_fsm_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_epicenter ON incidents USING GIST (epicenter);
CREATE INDEX IF NOT EXISTS idx_incidents_active_status ON incidents (fsm_status) 
    WHERE fsm_status NOT IN ('INCIDENT_CLOSED', 'ARCHIVED', 'CANCELLED_PRANK');

-- 6. Tabel Laporan Warga (Evaluasi Konsensus Spasial 100m)
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    reporter_phone VARCHAR(20) NOT NULL,
    device_fingerprint VARCHAR(128) NOT NULL,
    reported_geom GEOGRAPHY(Point, 4326) NOT NULL,
    gps_accuracy_meters NUMERIC(6, 2) NOT NULL,
    client_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_per_incident UNIQUE (incident_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_reports_geom ON incident_reports USING GIST (reported_geom);
CREATE INDEX IF NOT EXISTS idx_reports_time ON incident_reports (client_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reports_incident ON incident_reports (incident_id);

-- 7. Tabel Unit Armada (Dynamic Role Dispatching & Telemetri)
CREATE TABLE IF NOT EXISTS incident_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    posko_id UUID REFERENCES posko_stations(id) ON DELETE SET NULL,
    unit_code VARCHAR(30) NOT NULL,
    vehicle_type fleet_vehicle_type NOT NULL,
    water_capacity_liters INTEGER NOT NULL CHECK (water_capacity_liters >= 0),
    assigned_role tactical_unit_role NOT NULL DEFAULT 'UNASSIGNED',
    current_geom GEOGRAPHY(Point, 4326) NOT NULL,
    last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_units_incident ON incident_units (incident_id);
CREATE INDEX IF NOT EXISTS idx_units_geom ON incident_units USING GIST (current_geom);

-- 8. Tabel Sumber Air (Hidran, Tandon, Dermaga Sungai)
CREATE TABLE IF NOT EXISTS water_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE,
    name VARCHAR(120) NOT NULL,
    source_type water_source_category NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    capacity_liters INTEGER,
    pressure_bar NUMERIC(4, 2) DEFAULT 0.00,
    operational_status water_operational_status NOT NULL DEFAULT 'READY',
    last_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_sources_location ON water_sources USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_water_sources_status ON water_sources (operational_status);

-- 9. Tabel Barikade Selang Jalan (LineString)
CREATE TABLE IF NOT EXISTS road_barricades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    road_name VARCHAR(120) NOT NULL,
    path_geom GEOGRAPHY(LineString, 4326) NOT NULL,
    reason barricade_reason_type NOT NULL DEFAULT 'PRESSURIZED_HOSE_LINE',
    hose_length_meters INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_barricades_geom ON road_barricades USING GIST (path_geom);
CREATE INDEX IF NOT EXISTS idx_barricades_active ON road_barricades (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_barricades_incident ON road_barricades (incident_id);

-- 10. Tabel Log Mutasi Telemetri (Idempotensi & Last-Write-Wins)
CREATE TABLE IF NOT EXISTS telemetry_mutation_logs (
    mutation_uuid UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_id VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mutation_client_time ON telemetry_mutation_logs (client_timestamp DESC);

-- 11. Trigger Pembaruan Otomatis Kolom updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON incidents;
CREATE TRIGGER trg_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 12. Konfigurasi Supabase Realtime CDC
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
        ALTER PUBLICATION supabase_realtime ADD TABLE incident_units;
        ALTER PUBLICATION supabase_realtime ADD TABLE road_barricades;
        ALTER PUBLICATION supabase_realtime ADD TABLE water_sources;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Melanjutkan jika publication belum diinisialisasi
    NULL;
END $$;

ALTER TABLE incidents REPLICA IDENTITY FULL;
ALTER TABLE incident_units REPLICA IDENTITY FULL;
ALTER TABLE road_barricades REPLICA IDENTITY FULL;
ALTER TABLE water_sources REPLICA IDENTITY FULL;

-- 13. Kebijakan Keamanan Row Level Security (RLS)
ALTER TABLE posko_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_barricades ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_mutation_logs ENABLE ROW LEVEL SECURITY;

-- 13.1 Kebijakan Akses Publik (PWA Warga & Peta Taktis)
CREATE POLICY "Public read posko stations" ON posko_stations
    FOR SELECT USING (true);

CREATE POLICY "Public read active incidents" ON incidents
    FOR SELECT USING (fsm_status != 'ARCHIVED');

CREATE POLICY "Public insert incident reports" ON incident_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read water sources" ON water_sources
    FOR SELECT USING (true);

CREATE POLICY "Public read active barricades" ON road_barricades
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read incident units" ON incident_units
    FOR SELECT USING (true);

-- 13.2 Kebijakan Akses Operator Terotentikasi (COMMANDER & VOLUNTEER)
CREATE POLICY "Authenticated operators update units" ON incident_units
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated operators manage barricades" ON road_barricades
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated operators update water sources" ON water_sources
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated operators manage incidents" ON incidents
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated log telemetry mutations" ON telemetry_mutation_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);
