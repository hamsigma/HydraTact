"""Kompilator Peta Vektor MBTiles Offline Kota Samarinda (MVT Encoder Mandiri).

File: infra/tiles-pipeline/generate_mbtiles.py
PIC: @Ilham (TASK-109)
Single Source of Truth: docs/Architecture.md & docs/PRD.md

Menghasilkan berkas SQLite .mbtiles berstandar Mapbox Vector Tiles v2.0
(format pbf) berisi geometri jalan & Sungai Karang Mumus yang diambil dari
GeoJSON output samarinda_osm_filter.py. Tile dienkodes murni dengan
stdlib Python (protobuf wire format) sehingga tidak memerlukan Tippecanoe.
"""

import gzip
import json
import math
import os
import sqlite3
import struct
import sys
from typing import Any, Dict, List, Optional, Tuple

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from samarinda_osm_filter import ROADS_DATASET, WATERWAYS_DATASET  # noqa: E402

TILE_EXTENT = 4096


# ---------------------------------------------------------------------------
# Protobuf wire-format helpers (varint & length-delimited)
# ---------------------------------------------------------------------------

def zigzag(value: int) -> int:
    return (value << 1) ^ (value >> 63)


def varint(value: int) -> bytes:
    if value < 0:
        raise ValueError("varint requires non-negative value")
    out = bytearray()
    while value > 0x7F:
        out.append((value & 0x7F) | 0x80)
        value >>= 7
    out.append(value)
    return bytes(out)


def _tag(field: int, wire: int) -> bytes:
    return varint((field << 3) | wire)


def _ld(field: int, payload: bytes) -> bytes:
    return _tag(field, 2) + varint(len(payload)) + payload


# ---------------------------------------------------------------------------
# Proyeksi Web Mercator -> koordinat piksel tile
# ---------------------------------------------------------------------------

def mercator_norm(lat: float) -> float:
    lat = max(-85.05112878, min(85.05112878, lat))
    return 0.5 - math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) / (2 * math.pi)


def project_to_tile_px(
    lon: float, lat: float, zoom: int, tx: int, ty: int, extent: int = TILE_EXTENT
) -> Tuple[float, float]:
    n = 1 << zoom
    x = (lon / 360.0 + 0.5) * n * extent - tx * extent
    y = (mercator_norm(lat) - ty / n) * n * extent
    return x, y


def deg2num(lat_deg: float, lon_deg: float, zoom: int) -> Tuple[int, int]:
    lat_rad = math.radians(lat_deg)
    n = 1 << zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return xtile, ytile


# ---------------------------------------------------------------------------
# Kliping geometri ke kotak tile (Liang-Barsky & Sutherland-Hodgman)
# ---------------------------------------------------------------------------

def liang_barsky_segment(
    a: Tuple[float, float],
    b: Tuple[float, float],
    xmin: float,
    ymin: float,
    xmax: float,
    ymax: float,
) -> Optional[Tuple[Tuple[float, float], Tuple[float, float]]]:
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    t0, t1 = 0.0, 1.0
    for p, q in (
        (-dx, a[0] - xmin),
        (dx, xmax - a[0]),
        (-dy, a[1] - ymin),
        (dy, ymax - a[1]),
    ):
        if p == 0.0:
            if q < 0.0:
                return None
        else:
            r = q / p
            if p < 0.0:
                if r > t1:
                    return None
                if r > t0:
                    t0 = r
            else:
                if r < t0:
                    return None
                if r < t1:
                    t1 = r
    return (a[0] + t0 * dx, a[1] + t0 * dy), (a[0] + t1 * dx, a[1] + t1 * dy)


def clip_linestring(
    points: List[Tuple[float, float]],
    xmin: float,
    ymin: float,
    xmax: float,
    ymax: float,
) -> List[List[Tuple[float, float]]]:
    parts: List[List[Tuple[float, float]]] = []
    current: List[Tuple[float, float]] = []

    def flush() -> None:
        nonlocal current
        if len(current) >= 2:
            parts.append(current)
        current = []

    for i in range(len(points) - 1):
        a, b = points[i], points[i + 1]
        clipped = liang_barsky_segment(a, b, xmin, ymin, xmax, ymax)
        if clipped is None:
            flush()
            continue
        start, end = clipped
        if not current or (current and abs(current[-1][0] - start[0]) > 1e-9 or abs(current[-1][1] - start[1]) > 1e-9):
            flush()
            current = [start]
        current.append(end)
    flush()
    return parts


def clip_polygon(
    ring: List[Tuple[float, float]],
    xmin: float,
    ymin: float,
    xmax: float,
    ymax: float,
) -> Optional[List[Tuple[float, float]]]:
    pts = list(ring)
    if len(pts) >= 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if not pts:
        return None

    edges = [
        (lambda p: p[0] >= xmin, lambda a, b: _x_intersect(a, b, xmin, 0)),
        (lambda p: p[0] <= xmax, lambda a, b: _x_intersect(a, b, xmax, 1)),
        (lambda p: p[1] >= ymin, lambda a, b: _y_intersect(a, b, ymin, 0)),
        (lambda p: p[1] <= ymax, lambda a, b: _y_intersect(a, b, ymax, 1)),
    ]

    def x_at(a, b, x, _):
        t = (x - a[0]) / (b[0] - a[0]) if b[0] != a[0] else 0.0
        return (x, a[1] + t * (b[1] - a[1]))

    def y_at(a, b, y, _):
        t = (y - a[1]) / (b[1] - a[1]) if b[1] != a[1] else 0.0
        return (a[0] + t * (b[0] - a[0]), y)

    solvers = [
        (lambda a, b: x_at(a, b, xmin, 0)),
        (lambda a, b: x_at(a, b, xmax, 1)),
        (lambda a, b: y_at(a, b, ymin, 0)),
        (lambda a, b: y_at(a, b, ymax, 1)),
    ]

    for (inside, _), intersect in zip(edges, solvers):
        out: List[Tuple[float, float]] = []
        for i in range(len(pts)):
            cur = pts[i]
            prev = pts[i - 1]
            cur_in = inside(cur)
            prev_in = inside(prev)
            if cur_in:
                if not prev_in:
                    out.append(intersect(prev, cur))
                out.append(cur)
            elif prev_in:
                out.append(intersect(prev, cur))
        pts = out
        if not pts:
            return None

    return pts if len(pts) >= 3 else None


def _x_intersect(a, b, x, _):
    t = (x - a[0]) / (b[0] - a[0]) if b[0] != a[0] else 0.0
    return (x, a[1] + t * (b[1] - a[1]))


def _y_intersect(a, b, y, _):
    t = (y - a[1]) / (b[1] - a[1]) if b[1] != a[1] else 0.0
    return (a[0] + t * (b[0] - a[0]), y)


# ---------------------------------------------------------------------------
# Buffer polyline -> poligon (untuk koridor sungai)
# ---------------------------------------------------------------------------

def buffer_linestring_to_polygon(
    points: List[Tuple[float, float]], half_width_meters: float
) -> List[Tuple[float, float]]:
    """Menghasilkan poligon koridor dengan lebar konstan di sekitar garis tengah."""
    meters_per_deg_lat = 110574.0
    meters_per_deg_lon = 111320.0 * math.cos(math.radians(points[0][1]))
    half_dx = half_width_meters / meters_per_deg_lon
    half_dy = half_width_meters / meters_per_deg_lat

    left: List[Tuple[float, float]] = []
    right: List[Tuple[float, float]] = []
    n = len(points)
    for i in range(n):
        prev_p = points[max(0, i - 1)]
        next_p = points[min(n - 1, i + 1)]
        dx = next_p[0] - prev_p[0]
        dy = next_p[1] - prev_p[1]
        length = math.hypot(dx, dy)
        if length == 0:
            length = 1.0
        nx = (-dy / length) * half_dx
        ny = (dx / length) * half_dy
        left.append((points[i][0] + nx, points[i][1] + ny))
        right.append((points[i][0] - nx, points[i][1] - ny))

    ring = left + right[::-1]
    ring.append(ring[0])
    return ring


def _ring_area(ring: List[Tuple[float, float]]) -> float:
    area = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        area += x1 * y2 - x2 * y1
    return area / 2.0


# ---------------------------------------------------------------------------
# Layer & Feature MVT builders
# ---------------------------------------------------------------------------

class MvtLayer:
    def __init__(self, name: str, extent: int = TILE_EXTENT):
        self.name = name
        self.extent = extent
        self.keys: List[str] = []
        self.key_index: Dict[str, int] = {}
        self.values: List[bytes] = []
        self.value_index: Dict[bytes, int] = {}
        self.features: List[bytes] = []

    def _key(self, key: str) -> int:
        if key not in self.key_index:
            self.key_index[key] = len(self.keys)
            self.keys.append(key)
        return self.key_index[key]

    def _value(self, value: Any) -> int:
        msg = _encode_value(value)
        if msg not in self.value_index:
            self.value_index[msg] = len(self.values)
            self.values.append(msg)
        return self.value_index[msg]

    def add_feature(self, geom_type: int, geometry: bytes, props: Dict[str, Any]) -> None:
        if not geometry:
            return
        tags: List[int] = []
        for key, value in props.items():
            if value is None:
                continue
            tags.append(self._key(key))
            tags.append(self._value(value))
        packed_tags = b"".join(varint(t) for t in tags)
        feature = _ld(4, packed_tags)
        feature += _tag(5, 0) + varint(geom_type)
        feature += _ld(6, geometry)
        self.features.append(feature)

    def serialize(self) -> Optional[bytes]:
        if not self.features:
            return None
        out = _tag(15, 0) + varint(2)
        out += _ld(1, self.name.encode("utf-8"))
        for feature in self.features:
            out += _ld(2, feature)
        for key in self.keys:
            out += _ld(3, key.encode("utf-8"))
        for value in self.values:
            out += _ld(4, value)
        out += _tag(5, 0) + varint(self.extent)
        return out


def _encode_value(value: Any) -> bytes:
    if isinstance(value, bool):
        return _tag(7, 0) + varint(1 if value else 0)
    if isinstance(value, (int,)):
        return _tag(4, 0) + varint(value)
    if isinstance(value, float):
        return _tag(3, 1) + struct.pack("<d", value)
    return _ld(1, str(value).encode("utf-8"))


class _Cursor:
    def __init__(self) -> None:
        self.x = 0
        self.y = 0

    def move_to(self, x: int, y: int) -> bytes:
        dx, dy = x - self.x, y - self.y
        self.x, self.y = x, y
        return varint((1 << 3) | 1) + varint(zigzag(dx)) + varint(zigzag(dy))

    def line_tos(self, points: List[Tuple[int, int]]) -> bytes:
        count = len(points)
        if count == 0:
            return b""
        out = varint((count << 3) | 2)
        for x, y in points:
            dx, dy = x - self.x, y - self.y
            self.x, self.y = x, y
            out += varint(zigzag(dx)) + varint(zigzag(dy))
        return out

    @staticmethod
    def close_path() -> bytes:
        return varint((1 << 3) | 7)


def encode_linestring(parts: List[List[Tuple[int, int]]]) -> bytes:
    cursor = _Cursor()
    out = b""
    for part in parts:
        if len(part) < 2:
            continue
        out += cursor.move_to(*part[0])
        out += cursor.line_tos(part[1:])
    return out


def encode_polygon(ring: List[Tuple[int, int]]) -> bytes:
    cursor = _Cursor()
    out = cursor.move_to(*ring[0])
    out += cursor.line_tos(ring[1:-1])
    out += cursor.close_path()
    return out


# ---------------------------------------------------------------------------
# Kompilasi tile per zoom
# ---------------------------------------------------------------------------

def build_layers_for_tile(
    zoom: int, tx: int, ty: int
) -> Optional[bytes]:
    xmin, ymin = 0.0, 0.0
    xmax, ymax = float(TILE_EXTENT), float(TILE_EXTENT)

    def to_px(lon: float, lat: float) -> Tuple[float, float]:
        return project_to_tile_px(lon, lat, zoom, tx, ty)

    roads_layer = MvtLayer("roads")
    for road in ROADS_DATASET:
        coords = road["geometry"]["coordinates"]
        line_px = [to_px(lon, lat) for lon, lat in coords]
        clipped = clip_linestring(line_px, xmin, ymin, xmax, ymax)
        if not clipped:
            continue
        parts_int = [[(round(x), round(y)) for x, y in part] for part in clipped]
        geometry = encode_linestring(parts_int)
        props = dict(road["properties"])
        props["road_width_meters"] = float(props["road_width_meters"])
        roads_layer.add_feature(2, geometry, props)

    waterways_layer = MvtLayer("waterways")
    for waterway in WATERWAYS_DATASET:
        coords = waterway["geometry"]["coordinates"]
        width = float(waterway["properties"].get("width_meters", 20.0))
        ring_geo = buffer_linestring_to_polygon(
            [(float(lon), float(lat)) for lon, lat in coords], width / 2.0
        )
        ring_px = [to_px(lon, lat) for lon, lat in ring_geo]
        clipped_ring = clip_polygon(ring_px, xmin, ymin, xmax, ymax)
        if clipped_ring is None:
            continue
        if _ring_area(clipped_ring) < 0:
            clipped_ring.reverse()
        clipped_ring.append(clipped_ring[0])
        ring_int = [(round(x), round(y)) for x, y in clipped_ring]
        geometry = encode_polygon(ring_int)
        props = dict(waterway["properties"])
        props["width_meters"] = width
        waterways_layer.add_feature(3, geometry, props)
        # Garis tengah sungai untuk layer 'waterways-line'
        center_px = [to_px(lon, lat) for lon, lat in coords]
        center_clipped = clip_linestring(center_px, xmin, ymin, xmax, ymax)
        if center_clipped:
            parts_int = [[(round(x), round(y)) for x, y in part] for part in center_clipped]
            center_geometry = encode_linestring(parts_int)
            waterways_layer.add_feature(2, center_geometry, props)

    tile_msg = b""
    serialized_roads = roads_layer.serialize()
    serialized_waterways = waterways_layer.serialize()
    if serialized_roads:
        tile_msg += _ld(1, serialized_roads)
    if serialized_waterways:
        tile_msg += _ld(1, serialized_waterways)

    if not tile_msg:
        return None
    return gzip.compress(tile_msg)


def build_samarinda_mbtiles(output_path: str, min_zoom: int = 14, max_zoom: int = 18) -> str:
    """Menghasilkan berkas SQLite .mbtiles berstandar Mapbox Vector Tiles untuk aplikasi Flutter."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    if os.path.exists(output_path):
        os.remove(output_path)

    conn = sqlite3.connect(output_path)
    cur = conn.cursor()

    cur.execute("CREATE TABLE metadata (name TEXT, value TEXT);")
    cur.execute(
        "CREATE TABLE tiles (zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_data BLOB);"
    )
    cur.execute("CREATE UNIQUE INDEX tile_index ON tiles (zoom_level, tile_column, tile_row);")

    vector_layers_json = json.dumps(
        {
            "vector_layers": [
                {
                    "id": "roads",
                    "description": "Jaringan jalan lingkungan dan gang sempit",
                    "minzoom": min_zoom,
                    "maxzoom": max_zoom,
                    "fields": {
                        "name": "String",
                        "highway": "String",
                        "road_width_meters": "Number",
                        "surface": "String",
                        "emergency_accessible": "Boolean",
                        "tactical_constraint": "String",
                    },
                },
                {
                    "id": "waterways",
                    "description": "Sungai Karang Mumus dan saluran air",
                    "minzoom": min_zoom,
                    "maxzoom": max_zoom,
                    "fields": {
                        "name": "String",
                        "waterway": "String",
                        "width_meters": "Number",
                        "tidal_water_source": "Boolean",
                    },
                },
            ]
        }
    )

    metadata_entries = [
        ("name", "Samarinda Dense Offline Vector"),
        ("type", "baselayer"),
        ("version", "1.0"),
        ("description", "Peta Vektor Luring Gang Sempit Samarinda Ilir & Pelita (Zoom 14-18) untuk Relawan Lapangan"),
        ("format", "pbf"),
        ("minzoom", str(min_zoom)),
        ("maxzoom", str(max_zoom)),
        ("bounds", "117.1000,-0.5050,117.1600,-0.4350"),
        ("center", "117.1441,-0.4942,16"),
        ("json", vector_layers_json),
    ]
    cur.executemany("INSERT INTO metadata (name, value) VALUES (?, ?);", metadata_entries)

    center_lat, center_lon = -0.4942, 117.1441
    tiles_inserted = 0
    features_total = 0
    for z in range(min_zoom, max_zoom + 1):
        cx, cy = deg2num(center_lat, center_lon, z)
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                tx = cx + dx
                ty_xyz = cy + dy
                tms_y = (1 << z) - 1 - ty_xyz
                tile_data = build_layers_for_tile(z, tx, ty_xyz)
                if tile_data is None:
                    # Tile kosong tetap disimpan agar provider tidak melempar 404
                    tile_data = gzip.compress(b"")
                cur.execute(
                    "INSERT OR IGNORE INTO tiles (zoom_level, tile_column, tile_row, tile_data) VALUES (?, ?, ?, ?);",
                    (z, tx, tms_y, tile_data),
                )
                tiles_inserted += 1

    conn.commit()
    conn.close()

    file_size_kb = os.path.getsize(output_path) / 1024.0
    print(f"Generated MBTiles: {output_path} ({file_size_kb:.2f} KB, {tiles_inserted} tiles)")
    return output_path


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_asset_dir = os.path.abspath(
        os.path.join(current_dir, "..", "..", "apps", "mobile-volunteer", "assets", "maps")
    )
    target_mbtiles_path = os.path.join(target_asset_dir, "samarinda_dense.mbtiles")
    build_samarinda_mbtiles(target_mbtiles_path)
