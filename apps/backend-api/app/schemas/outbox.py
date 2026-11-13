from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class MutationOperation(str, Enum):
    """Jenis operasi mutasi yang dapat diantrekan saat kondisi luring (offline-first)."""
    UPDATE_WATER_STATUS = "UPDATE_WATER_STATUS"
    CREATE_BARRICADE = "CREATE_BARRICADE"
    DEACTIVATE_BARRICADE = "DEACTIVATE_BARRICADE"
    UNIT_TELEMETRY_UPDATE = "UNIT_TELEMETRY_UPDATE"


class OutboxMutationItem(BaseModel):
    """Butir mutasi tunggal dari antrean luring Isar DB di perangkat seluler."""
    mutation_uuid: UUID = Field(..., description="UUID unik mutasi lokal untuk idempotensi")
    operation: MutationOperation = Field(..., description="Tipe operasi mutasi basis data")
    target_id: UUID = Field(..., description="UUID entitas tujuan (insiden/unit/sumber air/barikade)")
    client_timestamp: datetime = Field(..., description="Stempel waktu saat aksi dilakukan di lapangan (Last-Write-Wins)")
    payload: Dict[str, Any] = Field(..., description="Payload data mutasi")


class OutboxBatchRequest(BaseModel):
    """Permintaan pengiriman kumpulan mutasi luring dari perangkat relawan."""
    device_id: str = Field(..., description="Identitas unik perangkat pengirim", examples=["android-unit-atk04"])
    unit_identifier: str = Field(..., description="Kode panggil armada pengirim", examples=["ATK-04"])
    mutations: List[OutboxMutationItem] = Field(..., min_length=1, description="Larik mutasi tertunda")


class MutationSyncStatus(str, Enum):
    """Status hasil rekonsiliasi mutasi pada basis data pusat."""
    APPLIED = "APPLIED"
    STALE_IGNORED = "STALE_IGNORED"
    REJECTED_CONFLICT = "REJECTED_CONFLICT"


class MutationResultItem(BaseModel):
    """Hasil pemrosesan per butir mutasi luring."""
    mutation_uuid: UUID = Field(..., description="UUID mutasi yang diproses")
    sync_status: MutationSyncStatus = Field(..., description="Status hasil sinkronisasi")
    reason: Optional[str] = Field(None, description="Alasan apabila mutasi diabaikan atau konflik")


class OutboxBatchData(BaseModel):
    """Data hasil rekonsiliasi kumpulan mutasi batch."""
    batch_processed_count: int = Field(..., description="Jumlah mutasi yang berhasil dievaluasi")
    results: List[MutationResultItem] = Field(..., description="Daftar status pemrosesan per mutasi")


class OutboxBatchResponse(BaseModel):
    """Respons pengiriman kumpulan mutasi antrean luring."""
    status: Literal["success"] = "success"
    data: OutboxBatchData
