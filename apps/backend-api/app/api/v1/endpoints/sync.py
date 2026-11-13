from fastapi import APIRouter, status

from app.schemas.outbox import (
    OutboxBatchRequest,
    OutboxBatchResponse,
)

router = APIRouter(prefix="/sync", tags=["Sinkronisasi Mutasi Luring (Offline-First)"])


@router.post(
    "/outbox-batch",
    response_model=OutboxBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Sinkronisasi massal mutasi tertunda dari Isar DB saat koneksi pulih",
    description="Menerima seluruh mutasi tertunda dari antrean Isar outbox di perangkat lapangan dan memprosesnya secara deterministik dengan aturan Last-Write-Wins.",
)
async def sync_outbox_batch(payload: OutboxBatchRequest):
    """Placeholder implementasi kontrak endpoint sinkronisasi mutasi luring."""
    raise NotImplementedError("Implementasi logika bisnis pada TASK berikutnya")
