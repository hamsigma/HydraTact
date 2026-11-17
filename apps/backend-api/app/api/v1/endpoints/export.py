"""
Endpoint Ekspor Data Spasial Taktis Insiden (GeoJSON & KML).
Digunakan oleh Posko Komando untuk serah terima data operasional ke BPBD & Dinas Pemadam Kebakaran Samarinda.
"""

from typing import Any, Dict
from uuid import UUID
from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import PlainTextResponse

from app.core.db import get_db_pool
from app.repositories.spatial import fetch_incident_detail_by_id

router = APIRouter(prefix="/incidents", tags=["Incident Export"])


@router.get(
    "/{incident_id}/export/geojson",
    summary="Ekspor lapisan taktis insiden ke format GeoJSON FeatureCollection",
    description="Menghasilkan GeoJSON FeatureCollection yang mencakup titik api (epicenter), posisi armada, dan perimeter taktis.",
)
async def export_incident_geojson(incident_id: UUID) -> Dict[str, Any]:
    pool = get_db_pool()
    detail = None
    if pool is not None:
        async with pool.acquire() as conn:
            detail = await fetch_incident_detail_by_id(conn, incident_id)
    if detail is None:
        detail = await fetch_incident_detail_by_id(None, incident_id)

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insiden dengan ID {incident_id} tidak ditemukan",
        )

    features = []

    # 1. Feature Titik Api (Epicenter)
    features.append({
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [detail.epicenter.coordinates[0], detail.epicenter.coordinates[1]],
        },
        "properties": {
            "entity": "INCIDENT_EPICENTER",
            "incident_code": detail.incident_code,
            "address": detail.street_address,
            "status": detail.status.value,
            "road_width_meters": detail.road_width_meters,
            "marker_color": "#DC2626",
        },
    })

    # 2. Features Unit Armada Taktis (ATTACKER & FEEDER)
    for unit in detail.allocated_units:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [unit.current_location.coordinates[0], unit.current_location.coordinates[1]],
            },
            "properties": {
                "entity": "RESPONDING_UNIT",
                "unit_id": str(unit.unit_id),
                "unit_code": unit.unit_identifier,
                "role": unit.assigned_role.value,
                "vehicle_type": unit.vehicle_type.value,
                "water_capacity_liters": unit.water_capacity_liters,
                "marker_color": "#DC2626" if unit.assigned_role.value == "ATTACKER" else "#D97706",
            },
        })

    return {
        "type": "FeatureCollection",
        "properties": {
            "generated_by": "HydraTact Samarinda Command System",
            "incident_code": detail.incident_code,
            "incident_status": detail.status.value,
        },
        "features": features,
    }


@router.get(
    "/{incident_id}/export/kml",
    response_class=Response,
    summary="Ekspor lapisan taktis insiden ke format KML (Google Earth / GIS Disdamkar)",
    description="Menghasilkan dokumen XML KML valid untuk diimpor ke Google Earth, QGIS, atau sistem BPBD Samarinda.",
)
async def export_incident_kml(incident_id: UUID) -> Response:
    pool = get_db_pool()
    detail = None
    if pool is not None:
        async with pool.acquire() as conn:
            detail = await fetch_incident_detail_by_id(conn, incident_id)
    if detail is None:
        detail = await fetch_incident_detail_by_id(None, incident_id)

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insiden dengan ID {incident_id} tidak ditemukan",
        )

    epicenter_lng, epicenter_lat = detail.epicenter.coordinates

    placemarks = [
        f"""    <Placemark>
      <name>Titik Api: {detail.incident_code}</name>
      <description>{detail.street_address} (Status: {detail.status.value}, Lebar Jalan: {detail.road_width_meters}m)</description>
      <Point>
        <coordinates>{epicenter_lng},{epicenter_lat},0</coordinates>
      </Point>
    </Placemark>"""
    ]

    for unit in detail.allocated_units:
        u_lng, u_lat = unit.current_location.coordinates
        placemarks.append(
            f"""    <Placemark>
      <name>{unit.unit_identifier} ({unit.assigned_role.value})</name>
      <description>Kendaraan: {unit.vehicle_type.value}, Tangki: {unit.water_capacity_liters}L</description>
      <Point>
        <coordinates>{u_lng},{u_lat},0</coordinates>
      </Point>
    </Placemark>"""
        )

    kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>HydraTact Incident {detail.incident_code}</name>
    <description>Operasi Taktis Pemadaman Kebakaran Samarinda - {detail.street_address}</description>
{"".join(placemarks)}
  </Document>
</kml>
"""

    return Response(
        content=kml_content,
        media_type="application/vnd.google-earth.kml+xml",
        headers={
            "Content-Disposition": f'attachment; filename="hydratact-{detail.incident_code.lower()}.kml"',
        },
    )
