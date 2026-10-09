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
cp .env.example .env   # renseigner DATABASE_URL, JWT_SECRET et ADMIN_PASSWORD (seed admin)
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
- **Import Excel** — reprise des données existantes (voir ci-dessous)

## Import des données Excel

Le fichier de suivi des bookings (`.xlsx`, colonnes DATE, HEURE, N°TC, MARCHANDISES,
TYPE TC, N° BOOKING, COMPAGNIE, ETAT (P/V), CLIENTS, CONTACT_TEL, IM_TRAC,
IM_REMORQUE, IN) crée ou complète clients, bookings, véhicules, conteneurs et
mouvements IN. L'import est **idempotent** : relancer le même fichier ne crée rien
de plus.

- **Depuis l'application** (administrateurs) : menu **Import Excel** → choisir le
  fichier → **Analyser** (aperçu, rien n'est enregistré) → **Importer**.
  5 Mo et 100 lignes maximum.
- **En ligne de commande** (gros fichiers) : déposer le fichier dans `backend/data/`
  (ignoré par git), puis :

  ```bash
  cd backend
  npm run import:excel -- --dry-run   # aperçu, aucune écriture
  npm run import:excel                # import réel (journal dans backend/logs/)
  ```

### Procédure en production

1. Sauvegarder la base (Supabase → Database → Backups) avant tout import.
2. Lancer d'abord l'aperçu et corriger dans le fichier les lignes en erreur.
3. Lancer l'import réel, puis vérifier le rapport (créations, erreurs ligne par ligne).
4. Ne jamais lancer `npm run seed` en production : `01_demo_data` efface les données.

## Documentation

- [Architecture](docs/architecture.md) et décisions ([docs/adr/](docs/adr/))
- [Runbook import Excel](docs/runbooks/import-excel.md)
- CI : [.github/workflows/](.github/workflows/) — lint, tests, build, migrations, CodeQL

## Variables d'environnement

Voir `backend/.env.example` et `ai-service/.env.example`.

## Déploiement

- **Backend** : à définir (Render / Railway / VPS)
- **Frontend** : à définir (Vercel / Netlify)
- **AI Service** : HuggingFace Spaces (Docker)
- **Base de données** : Supabase (PostgreSQL managé)
