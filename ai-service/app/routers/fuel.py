from fastapi import APIRouter

from app.schemas.fuel import FuelAnomalyRequest, FuelAnomalyResponse
from app.services.fuel_anomaly_detector import detect_fuel_anomalies

router = APIRouter()


@router.post("/detect/fuel-anomalies", response_model=FuelAnomalyResponse)
async def detect_fuel_anomalies_endpoint(payload: FuelAnomalyRequest):
    return detect_fuel_anomalies(payload)
