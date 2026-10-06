from pydantic import BaseModel
from typing import List


class BookingHistoryPoint(BaseModel):
    date: str
    booking_count: int


class BookingPredictionRequest(BaseModel):
    history: List[BookingHistoryPoint]
    horizon_days: int = 7


class BookingPredictionPoint(BaseModel):
    date: str
    predicted_count: float


class BookingPredictionResponse(BaseModel):
    predictions: List[BookingPredictionPoint]
