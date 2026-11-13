-- =============================================================================
-- HydraTact Samarinda - Seed Data Wilayah Kota Samarinda
-- File: supabase/seed.sql
-- Skenario: Simulasi Penanganan Kebakaran Pemukiman Padat Jl. Pelita Gg. 4
-- =============================================================================

-- Bersihkan data sebelumnya jika ada (urutan penghapusan sesuai relasi FK)
TRUNCATE TABLE telemetry_mutation_logs CASCADE;
TRUNCATE TABLE road_barricades CASCADE;
TRUNCATE TABLE incident_units CASCADE;
TRUNCATE TABLE incident_reports CASCADE;
TRUNCATE TABLE incidents CASCADE;
TRUNCATE TABLE water_sources CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE posko_stations CASCADE;

-- -----------------------------------------------------------------------------
-- 1. POSKO RELAWAN & PEMADAM KOTA SAMARINDA (6 Posko Strategis)
-- -----------------------------------------------------------------------------
INSERT INTO posko_stations (id, name, district, location, radio_channel) VALUES
('11111111-1111-1111-1111-111111111101', 'Posko Relawan Balakarcana Unit Pelita', 'Samarinda Ilir', ST_SetSRID(ST_MakePoint(117.1458, -0.4931), 4326)::geography, '142.850 MHz'),
('11111111-1111-1111-1111-111111111102', 'Posko PMK Swadaya Sungai Dama', 'Samarinda Ilir', ST_SetSRID(ST_MakePoint(117.1512, -0.4985), 4326)::geography, '143.100 MHz'),
('11111111-1111-1111-1111-111111111103', 'Posko Induk Disdamkar Kota Samarinda', 'Samarinda Kota', ST_SetSRID(ST_MakePoint(117.1490, -0.5020), 4326)::geography, '143.550 MHz'),
('11111111-1111-1111-1111-111111111104', 'Balakarcana Posko 01 Segiri', 'Samarinda Ulu', ST_SetSRID(ST_MakePoint(117.1395, -0.4880), 4326)::geography, '142.120 MHz'),
('11111111-1111-1111-1111-111111111105', 'Balakarcana Posko 02 Lambung Mangkurat', 'Samarinda Kota', ST_SetSRID(ST_MakePoint(117.1470, -0.4960), 4326)::geography, '142.450 MHz'),
('11111111-1111-1111-1111-111111111106', 'PMK Tirta Kencana PDAM Samarinda', 'Samarinda Ulu', ST_SetSRID(ST_MakePoint(117.1350, -0.4910), 4326)::geography, '143.800 MHz');

-- -----------------------------------------------------------------------------
-- 2. PENGGUNA SISTEM (Komandan Posko & Operator Lapangan)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, posko_id, full_name, phone_number, system_role, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111101', 'Hervino Islami Fasha', '+6281234567890', 'COMMANDER', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111101', 'Ilham Ramadhani', '+6281343408542', 'VOLUNTEER_ATTACKER', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111102', 'Ariyadi Pratama', '+6281598765432', 'VOLUNTEER_FEEDER', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '11111111-1111-1111-1111-111111111103', 'Operator Komando Disdamkar', '+6281112223334', 'COMMANDER', true);

-- -----------------------------------------------------------------------------
-- 3. DIREKTORI 30 TITIK SUMBER AIR KOTA SAMARINDA (Spasial WGS 84)
-- -----------------------------------------------------------------------------
INSERT INTO water_sources (id, code, name, source_type, location, capacity_liters, pressure_bar, operational_status, last_verified_by, last_verified_at) VALUES
-- Klaster Sekitar Jl. Pelita & Lambung Mangkurat (Radius Inti Simulasi)
('22222222-2222-2222-2222-222222222201', 'HYD-PLT-01', 'Hidran PDAM Jl. Pelita Utama (Depan Gang 2)', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1446, -0.4936), 4326)::geography, NULL, 5.20, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222202', 'HYD-PLT-02', 'Hidran PDAM Mulut Jl. Pelita Gang 4', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1438, -0.4945), 4326)::geography, NULL, 4.80, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222203', 'HYD-LMB-03', 'Hidran PDAM Simpang Lambung Mangkurat RT 08', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1475, -0.4962), 4326)::geography, NULL, 0.00, 'EMPTY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW() - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222204', 'HYD-LMB-04', 'Hidran PDAM Jembatan Lambung Mangkurat', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1462, -0.4950), 4326)::geography, NULL, 3.50, 'LOW_DISCHARGE', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW() - INTERVAL '1 hour'),
('22222222-2222-2222-2222-222222222205', 'HYD-SGR-05', 'Hidran PDAM Simpang Pasar Segiri', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1410, -0.4890), 4326)::geography, NULL, 5.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222206', 'HYD-PMD-06', 'Hidran PDAM Jl. Pemuda II', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1480, -0.4870), 4326)::geography, NULL, 4.20, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222207', 'HYD-DMA-07', 'Hidran PDAM Pasar Sungai Dama Barat', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1520, -0.4990), 4326)::geography, NULL, 4.60, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222208', 'HYD-DMA-08', 'Hidran PDAM Jl. Otto Iskandardinata (Otista)', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1535, -0.5010), 4326)::geography, NULL, 2.10, 'LOW_DISCHARGE', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222209', 'HYD-AMN-09', 'Hidran PDAM Jl. AM Sangaji (Eks Belibis)', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1380, -0.4840), 4326)::geography, NULL, 5.50, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222210', 'HYD-GAT-10', 'Hidran PDAM Jl. Gatot Subroto', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1430, -0.4860), 4326)::geography, NULL, 0.00, 'DAMAGED', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222211', 'HYD-KHW-11', 'Hidran PDAM Jembatan Kehewanan', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1472, -0.4975), 4326)::geography, NULL, 4.90, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222212', 'HYD-MLW-12', 'Hidran PDAM Jl. Mulawarman Pelabuhan', 'PDAM_HYDRANT', ST_SetSRID(ST_MakePoint(117.1505, -0.5040), 4326)::geography, NULL, 5.10, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),

-- Tandon Komunal Warga Permukiman Padat
('22222222-2222-2222-2222-222222222213', 'TND-RT14-01', 'Tandon Komunal Warga RT 14 Gg. 4 Pelita', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1439, -0.4945), 4326)::geography, 8000, 1.80, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222214', 'TND-RT12-02', 'Tandon Masjid Al-Muhajirin RT 12', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1451, -0.4939), 4326)::geography, 12000, 2.20, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222215', 'TND-RT15-03', 'Tandon Warga RT 15 Bantaran Karang Mumus', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1432, -0.4948), 4326)::geography, 5000, 1.50, 'LOW_DISCHARGE', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222216', 'TND-RT09-04', 'Tandon Musholla Nurul Iman Gg. 6', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1448, -0.4952), 4326)::geography, 6000, 1.90, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222217', 'TND-RT05-05', 'Tandon Balai RT 05 Sungai Dama', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1518, -0.4975), 4326)::geography, 7000, 2.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222218', 'TND-RT18-06', 'Tandon Pos Kamling RT 18 Lambung Mangkurat', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1468, -0.4968), 4326)::geography, 4000, 0.00, 'EMPTY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW() - INTERVAL '3 hours'),
('22222222-2222-2222-2222-222222222219', 'TND-RT22-07', 'Tandon Warga Gang Kinibalu', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1420, -0.4920), 4326)::geography, 9000, 2.10, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222220', 'TND-RT03-08', 'Tandon Masjid Darunni''mah Jl. Pelita', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1455, -0.4925), 4326)::geography, 15000, 2.40, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222221', 'TND-RT11-09', 'Tandon Komunal Gang 5 Pelita', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1444, -0.4948), 4326)::geography, 5000, 1.70, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222222', 'TND-RT07-10', 'Tandon Lapangan Futsal Pelita', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1460, -0.4940), 4326)::geography, 10000, 2.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222223', 'TND-RT25-11', 'Tandon Musholla Al-Ikhlas Segiri', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1405, -0.4875), 4326)::geography, 6000, 1.80, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222224', 'TND-RT02-12', 'Tandon Pasar Pagi Tepian', 'COMMUNITY_TOWER', ST_SetSRID(ST_MakePoint(117.1485, -0.5050), 4326)::geography, 10000, 0.00, 'DAMAGED', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW() - INTERVAL '5 hours'),

-- Titik Hisap Pasang Surut Sungai Karang Mumus (Sumber Air Tak Terbatas / Uncapped)
('22222222-2222-2222-2222-222222222225', 'RIV-SKM-01', 'Dermaga Hisap Sungai Karang Mumus (Jembatan Lambung Mangkurat)', 'RIVER_TIDAL_DOCK', ST_SetSRID(ST_MakePoint(117.1422, -0.4954), 4326)::geography, NULL, 0.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222226', 'RIV-SKM-02', 'Dermaga Hisap Belakang Gang 4 Pelita', 'RIVER_TIDAL_DOCK', ST_SetSRID(ST_MakePoint(117.1428, -0.4946), 4326)::geography, NULL, 0.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222227', 'RIV-SKM-03', 'Dermaga Hisap Jembatan Kehewanan (Sungai Dama)', 'RIVER_TIDAL_DOCK', ST_SetSRID(ST_MakePoint(117.1478, -0.4980), 4326)::geography, NULL, 0.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222228', 'RIV-SKM-04', 'Titik Pompa Apung Pasar Segiri (Karang Mumus)', 'RIVER_TIDAL_DOCK', ST_SetSRID(ST_MakePoint(117.1390, -0.4895), 4326)::geography, NULL, 0.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW()),
('22222222-2222-2222-2222-222222222229', 'RIV-SKM-05', 'Dermaga Perniagaan Karang Mumus', 'RIVER_TIDAL_DOCK', ST_SetSRID(ST_MakePoint(117.1440, -0.4970), 4326)::geography, NULL, 0.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NOW()),
('22222222-2222-2222-2222-222222222230', 'RIV-SKM-06', 'Dermaga Jembatan Nibung Karang Mumus Hulu', 'RIVER_TIDAL_DOCK', ST_SetSRID(ST_MakePoint(117.1415, -0.4915), 4326)::geography, NULL, 0.00, 'READY', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', NOW());

-- -----------------------------------------------------------------------------
-- 4. SIMULASI INSIDEN AKTIF JL. PELITA GG. 4 (Kode: HT-2026-089)
-- -----------------------------------------------------------------------------
INSERT INTO incidents (id, incident_code, street_address, epicenter, road_width_meters, fsm_status, reported_at, verified_at, closed_at) VALUES
('33333333-3333-3333-3333-333333333301', 'HT-2026-089', 'Jl. Pelita Gg. 4 RT 14, Kel. Pelita, Kec. Samarinda Ilir', ST_SetSRID(ST_MakePoint(117.1441, -0.4942), 4326)::geography, 1.80, 'SUPPRESSION_ACTIVE', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '12 minutes', NULL);

-- -----------------------------------------------------------------------------
-- 5. LOG PELAPORAN KONSENSUS SPASIAL WARGA (3 Laporan dalam Radius < 100m)
-- -----------------------------------------------------------------------------
INSERT INTO incident_reports (id, incident_id, reporter_phone, device_fingerprint, reported_geom, gps_accuracy_meters, client_timestamp) VALUES
('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', '+6281343408542', 'device-fp-citizen-01-pelita', ST_SetSRID(ST_MakePoint(117.1441, -0.4942), 4326)::geography, 4.20, NOW() - INTERVAL '15 minutes'),
('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', '+6281298765431', 'device-fp-citizen-02-pelita', ST_SetSRID(ST_MakePoint(117.1443, -0.4941), 4326)::geography, 5.80, NOW() - INTERVAL '14 minutes'),
('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', '+6285211223344', 'device-fp-citizen-03-pelita', ST_SetSRID(ST_MakePoint(117.1440, -0.4944), 4326)::geography, 3.90, NOW() - INTERVAL '13 minutes');

-- -----------------------------------------------------------------------------
-- 6. ALOKASI ARMADA TUGAS AUTO-SPLIT (Attacker di Gang vs Feeder di Jalan Utama)
-- -----------------------------------------------------------------------------
INSERT INTO incident_units (id, incident_id, posko_id, unit_code, vehicle_type, water_capacity_liters, assigned_role, current_geom, last_ping_at) VALUES
-- Unit ATK-04: Tossa 3 roda ramping (<1m), masuk ke dalam Gg. 4 dekat titik api
('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'ATK-04', 'THREE_WHEELER_TOSSA', 600, 'ATTACKER', ST_SetSRID(ST_MakePoint(117.1442, -0.4940), 4326)::geography, NOW()),
-- Unit FDR-02: Truk tangki 5000L, berhenti di mulut Gg. 4 Jl. Pelita Utama (lebar 6m)
('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111102', 'FDR-02', 'TANKER_TRUCK', 5000, 'FEEDER', ST_SetSRID(ST_MakePoint(117.1438, -0.4945), 4326)::geography, NOW());

-- -----------------------------------------------------------------------------
-- 7. BARIKADE SELANG MELINTANG JALAN (LineString 110 Meter)
-- -----------------------------------------------------------------------------
INSERT INTO road_barricades (id, incident_id, road_name, path_geom, reason, hose_length_meters, is_active, created_at) VALUES
('66666666-6666-6666-6666-666666666601', '33333333-3333-3333-3333-333333333301', 'Mulut Jl. Pelita Gg. 4 ke Titik Api RT 14', 
    ST_SetSRID(
        ST_GeomFromText('LINESTRING(117.1438 -0.4945, 117.1440 -0.4944, 117.1441 -0.4942)'),
        4326
    )::geography,
    'HOSE_CONNECTED', 110, true, NOW() - INTERVAL '10 minutes');

-- -----------------------------------------------------------------------------
-- 8. LOG IDEMPOTENSI & MUTASI AWAL (Uji Resolusi Last-Write-Wins)
-- -----------------------------------------------------------------------------
INSERT INTO telemetry_mutation_logs (mutation_uuid, user_id, device_id, action_type, payload, client_timestamp, server_received_at) VALUES
('77777777-7777-7777-7777-777777777701', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'android-unit-atk04', 'UPDATE_WATER_STATUS', 
    '{"source_id": "22222222-2222-2222-2222-222222222201", "status": "READY", "pressure_bar": 5.2}'::jsonb, 
    NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '8 minutes');
