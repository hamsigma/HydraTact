"""Unit tests untuk validasi integritas berkas SQLite MBTiles Samarinda.

File: infra/tiles-pipeline/tests/test_tiles_pipeline.py
PIC: @Ilham (TASK-108 & TASK-109)
"""

import gzip
import os
import sqlite3
import unittest


class TestSamarindaMBTiles(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        current_dir = os.path.dirname(__file__)
        cls.mbtiles_path = os.path.abspath(
            os.path.join(
                current_dir,
                "..",
                "..",
                "..",
                "apps",
                "mobile-volunteer",
                "assets",
                "maps",
                "samarinda_dense.mbtiles",
            )
        )

    def test_file_exists_and_size_constraint(self):
        """Memastikan berkas mbtiles ada dan ukuran <= 45 MB sesuai acceptance criteria."""
        self.assertTrue(os.path.exists(self.mbtiles_path), f"File not found: {self.mbtiles_path}")
        size_bytes = os.path.getsize(self.mbtiles_path)
        size_mb = size_bytes / (1024.0 * 1024.0)
        self.assertTrue(size_mb <= 45.0, f"Ukuran berkas {size_mb:.2f} MB melebihi batas 45 MB")

    def test_mbtiles_schema_and_metadata(self):
        """Memeriksa skema tabel SQLite metadata dan kesesuaian nilai konfigurasi."""
        conn = sqlite3.connect(self.mbtiles_path)
        cur = conn.cursor()

        # Cek keberadaan tabel metadata dan tiles
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cur.fetchall()]
        self.assertIn("metadata", tables)
        self.assertIn("tiles", tables)

        # Cek isi metadata
        cur.execute("SELECT name, value FROM metadata;")
        meta_dict = dict(cur.fetchall())

        self.assertEqual(meta_dict.get("format"), "pbf")
        self.assertEqual(meta_dict.get("minzoom"), "14")
        self.assertEqual(meta_dict.get("maxzoom"), "18")
        self.assertIn("bounds", meta_dict)
        self.assertIn("center", meta_dict)

        conn.close()

    def test_tiles_content_and_zoom_range(self):
        """Memeriksa keberadaan petak (tiles) dan rentang zoom 14 hingga 18."""
        conn = sqlite3.connect(self.mbtiles_path)
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*), MIN(zoom_level), MAX(zoom_level) FROM tiles;")
        count, min_z, max_z = cur.fetchone()

        self.assertTrue(count > 0, "Tabel tiles tidak boleh kosong")
        self.assertEqual(min_z, 14)
        self.assertEqual(max_z, 18)

        # Periksa validitas payload blob (harus gzip valid)
        cur.execute("SELECT tile_data FROM tiles LIMIT 1;")
        sample_blob = cur.fetchone()[0]
        self.assertTrue(isinstance(sample_blob, bytes))

        decompressed = gzip.decompress(sample_blob)
        self.assertTrue(len(decompressed) > 0)

        conn.close()


if __name__ == "__main__":
    unittest.main()

