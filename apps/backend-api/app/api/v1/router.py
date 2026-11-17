from fastapi import APIRouter

from app.api.v1.endpoints.barricades import router as barricades_router
from app.api.v1.endpoints.export import router as export_router
from app.api.v1.endpoints.incidents import router as incidents_router
from app.api.v1.endpoints.sync import router as sync_router
from app.api.v1.endpoints.units import router as units_router
from app.api.v1.endpoints.water_sources import router as water_sources_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(incidents_router)
api_v1_router.include_router(export_router)
api_v1_router.include_router(units_router)
api_v1_router.include_router(water_sources_router)
api_v1_router.include_router(barricades_router)
api_v1_router.include_router(sync_router)
