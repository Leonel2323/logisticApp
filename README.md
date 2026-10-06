# SOBRO Logistics Platform

Plateforme de gestion logistique portuaire pour **SOBRO SARL** (Douala, Cameroun).

## Stack

| Couche        | Technologie                              |
|---------------|-------------------------------------------|
| Frontend      | React + Vite + Tailwind CSS               |
| Backend       | Node.js + Express + Knex (MVC)            |
| Base de données | PostgreSQL (Supabase)                   |
| IA Lite       | FastAPI + Prophet + Isolation Forest      |

## Structure du monorepo

```
logisticApp/
├── frontend/      # SPA React (login, dashboard, bookings, containers, clients, vehicles, drivers, fuel)
├── backend/       # API Express (auth JWT, CRUD métiers, validation Joi)
├── ai-service/    # Microservice FastAPI (prédictions & détection d'anomalies)
└── .claude/       # Configuration Claude Code pour ce dépôt
```

## Démarrage rapide

### 1. Backend

```bash
cd backend
cp .env.example .env   # renseigner DATABASE_URL (Supabase) et JWT_SECRET
npm install
npm run migrate
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. AI Service

```bash
cd ai-service
python -m venv .venv
.venv/Scripts/activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## Modules métier

- **Bookings** — réservations de créneaux portuaires
- **Containers** — suivi des conteneurs
- **Clients** — gestion des clients/transitaires
- **Vehicles** — flotte de véhicules
- **Drivers** — chauffeurs
- **Fuel** — transactions de carburant (+ détection d'anomalies IA)

## Variables d'environnement

Voir `backend/.env.example` et `ai-service/.env.example`.

## Déploiement

- **Backend** : à définir (Render / Railway / VPS)
- **Frontend** : à définir (Vercel / Netlify)
- **AI Service** : HuggingFace Spaces (Docker)
- **Base de données** : Supabase (PostgreSQL managé)
