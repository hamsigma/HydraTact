from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Tuple
from pydantic import BaseModel, Field


class GeoPoint(BaseModel):
    """Geometri titik koordinat WGS 84 (SRID 4326) format [longitude, latitude]."""
    type: Literal["Point"] = "Point"
    coordinates: Tuple[float, float] = Field(
        ...,
        description="Geometri koordinat [longitude, latitude] WGS 84 (SRID 4326)",
        examples=[(117.1441, -0.4942)],
    )


class GeoLineString(BaseModel):
    """Geometri lintasan garis WGS 84 (SRID 4326) format larik [[longitude, latitude], ...]."""
    type: Literal["LineString"] = "LineString"
    coordinates: List[Tuple[float, float]] = Field(
        ...,
        min_length=2,
        description="Larik koordinat garis [longitude, latitude] WGS 84 (SRID 4326)",
        examples=[[(117.1438, -0.4945), (117.1440, -0.4944), (117.1441, -0.4942)]],
    )


class IncidentFSMStatus(str, Enum):
    """Status siklus hidup insiden kebakaran pada Finite State Machine (FSM)."""
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    DISPATCHING = "DISPATCHING"
    SUPPRESSION_ACTIVE = "SUPPRESSION_ACTIVE"
    OVERHAUL_COOLING = "OVERHAUL_COOLING"
    INCIDENT_CLOSED = "INCIDENT_CLOSED"
    ARCHIVED = "ARCHIVED"
    CANCELLED_PRANK = "CANCELLED_PRANK"


class UserSystemRole(str, Enum):
    """Peran hak akses sistem."""
    COMMANDER = "COMMANDER"
    VOLUNTEER = "VOLUNTEER"
    CITIZEN = "CITIZEN"


class VehicleType(str, Enum):
    """Kategori armada pemadam kebakaran."""
    LARGE_TANK = "LARGE_TANK"
    MEDIUM_TANK = "MEDIUM_TANK"
    THREE_WHEELER = "THREE_WHEELER"
    PORTABLE_PUMP = "PORTABLE_PUMP"


# Backward compatibility alias
FleetVehicleType = VehicleType


class TacticalRole(str, Enum):
    """Peran taktis armada dalam insiden."""
    ATTACKER = "ATTACKER"
    FEEDER = "FEEDER"
    RESERVE_FEEDER = "RESERVE_FEEDER"
    DIRECT_ATTACK = "DIRECT_ATTACK"
    UNASSIGNED = "UNASSIGNED"


# Backward compatibility alias
AssignedRole = TacticalRole


class WaterSourceType(str, Enum):
    """Tipe sumber pasokan air di lapangan."""
    PDAM_HYDRANT = "PDAM_HYDRANT"
    COMMUNITY_TOWER = "COMMUNITY_TOWER"
    RIVER_TIDAL_DOCK = "RIVER_TIDAL_DOCK"


class WaterSourceStatus(str, Enum):
    """Kondisi kesiapan pasokan air."""
    READY = "READY"
    LOW_DISCHARGE = "LOW_DISCHARGE"
    EMPTY = "EMPTY"
    DAMAGED = "DAMAGED"


class BarricadeReason(str, Enum):
    """Alasan penutupan ruas jalan untuk barikade selang."""
    HOSE_CONNECTED = "HOSE_CONNECTED"
    FIRE_SPREAD = "FIRE_SPREAD"
    COLLAPSED_DEBRIS = "COLLAPSED_DEBRIS"
    ACCESS_LOCKED = "ACCESS_LOCKED"


class ErrorDetail(BaseModel):
    """Struktur detail kesalahan HTTP terstandarisasi."""
    code: str = Field(..., description="Kode error mesin terdefinisi", examples=["INVALID_FSM_TRANSITION"])
    message: str = Field(..., description="Pesan penjelasan kesalahan ramah pengguna")
    details: Optional[Dict[str, Any]] = Field(None, description="Informasi teknis tambahan pendukung resolusi")


class ErrorResponse(BaseModel):
    """Amplop respons kesalahan HydraTact."""
    status: Literal["error"] = "error"
    error: ErrorDetail
