#!/usr/bin/env bash
# ==============================================================================
# Pipeline Kompilasi Petak Vektor MBTiles Tippecanoe Kota Samarinda
# File: infra/tiles-pipeline/tippecanoe_pipeline.sh
# PIC: @Ilham (TASK-109)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/output"
TARGET_ASSET_DIR="${SCRIPT_DIR}/../../apps/mobile-volunteer/assets/maps"
MBTILES_OUT="${TARGET_ASSET_DIR}/samarinda_dense.mbtiles"

echo "[HydraTact MBTiles] 1. Mengekstrak fitur jalan & hidrografi dari OSM Samarinda..."
python3 "${SCRIPT_DIR}/samarinda_osm_filter.py"

echo "[HydraTact MBTiles] 2. Memastikan direktori target aset ada..."
mkdir -p "${TARGET_ASSET_DIR}"

if command -v tippecanoe &> /dev/null; then
    echo "[HydraTact MBTiles] 3. Menjalankan Tippecanoe CLI (Zoom 14-18)..."
    tippecanoe -o "${MBTILES_OUT}" \
        -z 18 -Z 14 \
        --force \
        --drop-densest-as-needed \
        --extend-zooms-if-still-dropping \
        -l roads "${OUTPUT_DIR}/samarinda_roads.geojson" \
        -l waterways "${OUTPUT_DIR}/samarinda_waterways.geojson"
else
    echo "[HydraTact MBTiles] 3. Tippecanoe native binary tidak ditemukan. Menggunakan generator SQLite MBTiles bawaan..."
    python3 "${SCRIPT_DIR}/generate_mbtiles.py"
fi

echo "[HydraTact MBTiles] Berkas berhasil dihasilkan di: ${MBTILES_OUT}"
ls -lh "${MBTILES_OUT}"

