# Architecture

## Vue d'ensemble

```
Navigateur ──► frontend (React + Vite, SPA)
                  │  HTTPS, JSON, JWT Bearer (axios + intercepteur)
                  ▼
               backend (Node.js + Express, API REST /api/*)
                  │  Knex (pool pg)                 │  HTTP
                  ▼                                 ▼
               PostgreSQL 17 + pgvector         ai-service (FastAPI)
               (Supabase)                       Prophet / Isolation Forest
```

| Application | Rôle | Point d'entrée |
|---|---|---|
| `frontend/` | Interface (bookings, conteneurs, import Excel…) | `src/main.jsx`, routes dans `src/router/AppRouter.jsx` |
| `backend/` | API REST, règles métier, accès BDD | `server.js` → `src/app.js` → `src/routes/index.js` |
| `ai-service/` | Prédiction d'épuisement des bookings, anomalies carburant | `main.py` |

## Backend : couches

```
routes/        endpoint + middlewares (authenticate, authorize(rôle), validate(Joi))
  └► controllers/  orchestration HTTP, try/catch → next(err), réponse { success, data, error }
       └► services/    logique métier sans HTTP (stats, import Excel)
            └► models/     accès aux données (Knex), contrôles d'intégrité (doublons, FK)
```

- Le schéma de la base vient **uniquement** des migrations Knex (`src/db/migrations/`).
- Les erreurs 4xx portent un message français ; `errorHandler` masque les 5xx en production.
- Les tests unitaires remplacent la base par des mocks : aucune base n'est nécessaire
  pour `npm test`. Le workflow `migrations.yml` vérifie, lui, les migrations sur un
  PostgreSQL 17 + pgvector réel.

## Frontend

`pages/` (écrans) → `hooks/` (React Query : cache, invalidations) → `services/`
(appels axios). Composants partagés dans `components/`, contexte d'auth et de
notifications dans `context/`.

## Décisions

Voir [`adr/`](adr/) : monorepo ([0001](adr/0001-monorepo.md)), backend en
couches ([0002](adr/0002-backend-en-couches.md)).
