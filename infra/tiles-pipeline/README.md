# Pipeline Peta Vektor Luring Kota Samarinda (`.mbtiles`)

> **Penanggung Jawab:** `@Ilham` (Data & Spatial Backend Engineer)  
> **Modul:** `infra/tiles-pipeline` (Tugas: `TASK-108` & `TASK-109`)  
> **Target Berkas:** `apps/mobile-volunteer/assets/maps/samarinda_dense.mbtiles` ($\le 45\text{ MB}$, Zoom 14--18)  
> **Penerima Dependensi:** `@Ariyadi` (`TASK-401` — Renderer Flutter Map MBTiles)

---

## 1. Komponen Pipeline

1. **`samarinda_osm_filter.py`**:
   * Memfilter jaringan jalan lingkungan (`highway=residential`, `living_street`, `alley`, `footway`) pada bounding box Kota Samarinda (`117.13, -0.505, 117.16, -0.480`).
   * Mengikutsertakan atribut lebar jalan (`road_width_meters`) dan pembatas lorong sempit (misal: Jl. Pelita Gg. 4 selebar $1,8\text{ m}$).
   * Mengintegrasikan data hidrografi badan air Sungai Karang Mumus.
   * Menghasilkan berkas GeoJSON di `infra/tiles-pipeline/output/`.

2. **`generate_mbtiles.py`**:
   * Kompilator mandiri Python yang menghasilkan SQLite database `.mbtiles` berstandar Mapbox Vector Tiles v2.0.
   * Beroperasi secara portabel tanpa memerlukan kompilasi native C++ Tippecanoe pada sistem Windows.

3. **`tippecanoe_pipeline.sh`**:
   * Skrip otomatisasi shell untuk lingkungan Linux / CI / Docker yang menjalankan utilitas resmi Mapbox Tippecanoe:
     ```bash
     tippecanoe -o samarinda_dense.mbtiles -z 18 -Z 14 --drop-densest-as-needed \
       -l roads output/samarinda_roads.geojson \
       -l waterways output/samarinda_waterways.geojson
     ```

---

## 2. Cara Menjalankan

```bash
# Menjalankan ekstraksi dan kompilasi MBTiles:
python infra/tiles-pipeline/samarinda_osm_filter.py
python infra/tiles-pipeline/generate_mbtiles.py
```

Berkas keluaran otomatis ditaruh di:
`apps/mobile-volunteer/assets/maps/samarinda_dense.mbtiles`
dan telah didaftarkan pada `apps/mobile-volunteer/pubspec.yaml`.
