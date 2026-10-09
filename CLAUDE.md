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
  (détection d'anomalies), déployé sur HuggingFace Spaces via Docker + Chatbot RAG (HuggingFace Spaces)

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

## Conventions (module auth = référence)
- 1 fichier par responsabilité : service, controller, routes, validator
- async/await partout, try/catch → next(error)
- Validation Joi sur toutes les routes
- Messages d'erreur en français
- Réponses JSON : { data } ou { error }
- Pagination : ?page=1&limit=20
- Auth : JWT Bearer, middleware authenticate + authorize(...roles)

## Module IA Lite
- Prédiction épuisement booking (Prophet)
- Alertes intelligentes (règles Node.js)
- Chatbot assistant (LangChain + HuggingFace + pgvector)

## Frontend — Conventions
- React Router v6 pour le routing
- Axios avec interceptor pour le token JWT
- React Query pour le data fetching (cache + loading + erreurs)
- Tailwind CSS pour le styling (pas de CSS custom)
- Composants réutilisables : Table, Pagination, FilterBar, StatusBadge, Loader, ErrorMessage
- Pages dans /pages, composants dans /components
- Formulaires : react-hook-form + validation Joi côté client (résumé)

## Commandes
- `npm run dev` (backend) / `npm run dev` (frontend)
- `npm test` (Jest backend / Vitest frontend)
- `npm run migrate` / `npm run seed`
- `npm run import:excel [-- [--dry-run] fichier.xlsx]` (backend) : import Excel ; sans
  chemin, prend l'unique .xlsx de `backend/data/` ; `--dry-run` = aperçu sans écriture

## Règles
- Ne jamais exposer password_hash ni erreurs SQL brutes
- Toujours vérifier les FK avant insertion
- Toujours ajouter les index sur les colonnes filtrées
- TDD : tests avant code pour les nouveaux modules
- Un endpoint par responsabilité métier. Pas de doublon.

## Jour 12 — Focus : Jalon 2 — Validation Complète Phase 2

### Objectifs journaliers précis
1. **Valider le parcours utilisateur complet** : 
   - Login → Dashboard → Bookings → Détail booking → Créer conteneur → 
     Marquer traité → Voir stats mises à jour → Retour bookings
2. **Vérifier la cohérence des données** importées au J11 :
   - COUNT(*) sur bookings, containers, clients, vehicles
   - Aucune FK orpheline
   - Aucun doublon sur container_number
   - Tous les types valides (40FT/20FT/10FT)
   - Tous les états valides (PLEIN/VIDE)
3. **Tester les cas limites** :
   - Booking vide (0 conteneurs)
   - Booking presque terminé (pct >= 80%)
   - Booking en retard (end_date < today && solde > 0)
   - Conteneur avec numéro dupliqué → erreur 409
   - Conteneur avec booking_id inexistant → erreur 404
4. **Vérifier la mise à jour temps réel** :
   - Marquer un conteneur traité → stats mises à jour instantanément
   - Invalidation React Query fonctionnelle
5. **Auditer la qualité** :
   - Tous les tests backend passent (Jest)
   - Tous les tests frontend passent (Vitest)
   - Couverture > 70% sur les modules auth, bookings, containers
7. **Créer le tag Git `v0.2-metier`** :
   - Point de restauration pour la Phase 3
8. **Documenter les endpoints disponibles** :
   - Liste des routes API (auth, bookings, containers)
   - Exemples de requêtes/réponses

### Contexte technique
- Phase 2 : Cœur métier (Bookings + Containers + Stats)
- Phase 1 : Auth validée (tag v0.1-auth)
- J11 : Import Excel terminé, données réelles en BDD
- J12 : Validation finale avant Phase 3 (Clients, Flotte, Carburant)

### Ce qui doit être prêt pour la Phase 3
- Le module Bookings/Containers est stable
- Les stats QTE_BK/QTE_ENL/SOLDE sont fiables
- Le parcours de saisie est fluide
- Les données réelles sont en BDD

### Pièges à éviter (Jour 12)
- Ne pas oublier de tester le parcours complet de bout en bout (pas juste les unités)
- Ne pas oublier de tester les cas limites (booking vide, en retard, presque fini)
- Ne pas oublier de vérifier la cohérence des données importées (COUNT + FK)
- Ne pas oublier de tester la mise à jour temps réel après markAsProcessed
- Ne pas oublier de vérifier que les stats sont cohérentes avec l'Excel d'origine
- Ne pas oublier de tester les erreurs (409, 404, 401, 403)
- Ne pas oublier de vérifier le responsive (mobile, tablette, desktop)
- Ne pas oublier de tester avec Spector MCP (UI)
- Ne pas oublier de créer le tag Git v0.2-metier
- Ne pas oublier d'enregistrer la démo de 3 minutes
- Ne pas oublier de documenter les endpoints dans un fichier API.md

### Économie de tokens
- Ne pas relire tout le projet : `git status` et MCP Supabase suffisent
- Utiliser Spector MCP pour l'UI, pas de descriptions verbales
- Prompts spécifiques : cibler les fichiers concernés
- Un prompt = une tâche (validation, tests, démo séparés)