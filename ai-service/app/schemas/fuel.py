from pydantic import BaseModel
from typing import List, Optional


class FuelTransactionInput(BaseModel):
    id: int
    vehicle_id: int
    liters: float
    cost_xaf: float
    odometer_reading: Optional[int] = None
    transaction_at: str


class FuelAnomalyRequest(BaseModel):
    transactions: List[FuelTransactionInput]


class FuelAnomalyResult(BaseModel):
    id: int
    is_anomaly: bool
    score: float


class FuelAnomalyResponse(BaseModel):
    results: List[FuelAnomalyResult]
