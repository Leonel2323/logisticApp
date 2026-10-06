---
title: SOBRO AI Service
emoji: 🚢
colorFrom: blue
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# SOBRO AI Service

Microservice FastAPI (IA Lite) pour la plateforme logistique SOBRO.

## Endpoints

- `GET /health` — vérification de disponibilité
- `POST /predict/booking` — prévision de bookings (Prophet)
- `POST /detect/fuel-anomalies` — détection d'anomalies de carburant (Isolation Forest)

## Démarrage local

```bash
python -m venv .venv
.venv/Scripts/activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```
