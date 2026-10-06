from fastapi import FastAPI

from app.routers import health, booking, fuel

app = FastAPI(title="SOBRO AI Service", version="0.1.0")

app.include_router(health.router)
app.include_router(booking.router)
app.include_router(fuel.router)
