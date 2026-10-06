# CLAUDE.md

Guide pour Claude Code sur le dépôt **SOBRO Logistics Platform**.

## Contexte métier

Plateforme logistique portuaire pour SOBRO SARL (Douala, Cameroun) : gestion des
réservations portuaires (bookings), conteneurs, clients/transitaires, flotte de
véhicules, chauffeurs et transactions de carburant, avec un service IA léger
pour la prédiction de bookings et la détection d'anomalies de consommation.

## Stack

- **Frontend** : React + Vite + Tailwind CSS, JavaScript pur (pas de TypeScript)
- **Backend** : Node.js + Express, architecture MVC, Knex comme query builder
- **Base de données** : PostgreSQL hébergé sur Supabase
- **IA Lite** : FastAPI (Python) + Prophet (prévision) + Isolation Forest
  (détection d'anomalies), déployé sur HuggingFace Spaces via Docker

## Structure du monorepo

```
frontend/      SPA React (routes: login, dashboard, bookings, containers,
                clients, vehicles, drivers, fuel)
backend/       API Express
  src/config/        configuration (db, env)
  src/controllers/   logique des routes (fine, déléguée aux models)
  src/routes/        définition des endpoints Express
  src/middlewares/   auth JWT, validation Joi, gestion d'erreurs
  src/validations/   schémas Joi par ressource
  src/models/        accès aux données via Knex
  src/db/migrations/ migrations Knex
  src/db/seeds/      seeds Knex
ai-service/    FastAPI
  app/routers/       endpoints (/health, /predict, /detect)
  app/schemas/       modèles Pydantic (requêtes/réponses)
  app/services/      logique de prédiction / détection
```

## Conventions de code

- **JavaScript pur** côté frontend/backend, pas de TypeScript pour l'instant.
- **async/await partout** côté backend — pas de callbacks ni de chaînes `.then`.
- **Validation Joi obligatoire** sur toutes les routes backend qui reçoivent un
  payload (body/query/params), via le middleware `validate` + un schéma dans
  `src/validations/`.
- Un contrôleur ne contient pas de logique SQL directe : il délègue à un model.
- Les migrations Knex sont la seule source de vérité du schéma — ne pas modifier
  la BDD manuellement.
- Réponses API au format `{ success, data, error }`.
- Les routes protégées utilisent le middleware `authMiddleware` (JWT Bearer).

## Commandes utiles

```bash
# Backend
cd backend && npm run dev         # démarrage avec nodemon
cd backend && npm run migrate     # lancer les migrations Knex
cd backend && npm run migrate:rollback
cd backend && npm run seed

# Frontend
cd frontend && npm run dev
cd frontend && npm run build

# AI service
cd ai-service && uvicorn main:app --reload
```

## Ce que Claude doit éviter

- Ne pas ajouter TypeScript sans demande explicite.
- Ne pas écrire de logique métier dans les migrations.
- Ne pas committer de fichiers `.env` (voir `.gitignore`).
- Ne pas contourner la validation Joi « pour aller plus vite ».
- Ne pas lancer de `push` ou de commandes destructrices Git sans confirmation.

## État actuel

Le projet est au stade **scaffolding** : structure posée, pas de logique métier
implémentée. Les prochaines étapes typiques seront, dans l'ordre : auth JWT
fonctionnelle, CRUD par ressource, intégration frontend ↔ API, puis branchement
du service IA.

## Module IA Lite
- Prédiction épuisement booking (Prophet)
- Alertes intelligentes (règles Node.js)
- Chatbot assistant (LangChain + HuggingFace + pgvector)

## methode de developement
- Comprendre le besoin.
- Identifier les fichiers concernés.
- Ne lire que les fichiers nécessaires.
- Proposer brièvement la solution.
- Modifier uniquement les fichiers nécessaires.
- Tester la modification.
- Vérifier les régressions évidentes.
- Résumer les fichiers modifiés.