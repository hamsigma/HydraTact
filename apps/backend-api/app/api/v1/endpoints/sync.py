from fastapi import APIRouter, status

from app.core.db import get_db_pool
from app.repositories.outbox_sync import process_outbox_batch_sync
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
    """Memproses antrean mutasi luring dengan aturan Last-Write-Wins berbasis client_timestamp."""
    pool = get_db_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            data = await process_outbox_batch_sync(conn, payload)
            return OutboxBatchResponse(status="success", data=data)

    data = await process_outbox_batch_sync(None, payload)
    return OutboxBatchResponse(status="success", data=data)

