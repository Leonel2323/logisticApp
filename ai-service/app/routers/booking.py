from fastapi import APIRouter

from app.schemas.booking import BookingPredictionRequest, BookingPredictionResponse
from app.services.booking_predictor import predict_bookings

router = APIRouter()


@router.post("/predict/booking", response_model=BookingPredictionResponse)
async def predict_booking(payload: BookingPredictionRequest):
    return predict_bookings(payload)
