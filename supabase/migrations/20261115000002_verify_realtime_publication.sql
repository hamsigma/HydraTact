-- Migrasi Verifikasi dan Penguatan Supabase Realtime CDC (TASK-207)
-- Memastikan publikasi 'supabase_realtime' aktif mencakup seluruh tabel taktis
-- dengan REPLICA IDENTITY FULL untuk penyiaran data lengkap saat UPDATE / DELETE.

DO $$
BEGIN
    -- 1. Buat publikasi supabase_realtime jika belum ada
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- 2. Tambahkan tabel taktis ke publikasi jika belum terdaftar
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'incidents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'incident_units'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE incident_units;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'road_barricades'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE road_barricades;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'water_sources'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE water_sources;
    END IF;
END $$;

-- 3. Atur REPLICA IDENTITY FULL agar payload event CDC memuat data baris sebelum dan sesudah perubahan
ALTER TABLE incidents REPLICA IDENTITY FULL;
ALTER TABLE incident_units REPLICA IDENTITY FULL;
ALTER TABLE road_barricades REPLICA IDENTITY FULL;
ALTER TABLE water_sources REPLICA IDENTITY FULL;
