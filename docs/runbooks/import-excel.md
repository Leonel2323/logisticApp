# Runbook — Import des données Excel

Import idempotent du fichier de suivi des bookings : relancer le même fichier ne
crée rien de plus. Détails techniques : `backend/src/services/excelImportService.js`.

## Depuis l'application (administrateur, ≤ 100 lignes)

Menu **Import Excel** → choisir le `.xlsx` → **Analyser** (aperçu, aucune écriture)
→ vérifier les erreurs et avertissements → **Importer**.

## En ligne de commande (gros fichiers)

```bash
cd backend
# déposer le fichier dans backend/data/ (ignoré par git)
npm run import:excel -- --dry-run   # aperçu
npm run import:excel                # import réel, journal dans backend/logs/
```

## Procédure en production

1. Sauvegarder la base (Supabase → Database → Backups).
2. Lancer l'aperçu ; corriger dans le fichier les lignes en erreur.
3. Lancer l'import réel ; contrôler le rapport (créations, erreurs, avertissements).
4. Ne jamais lancer `npm run seed` en production : `01_demo_data` efface les données.

## Pièges connus

- Après un `npm run seed` en dev, des conteneurs de démo `ZKUM000xx` peuvent porter
  les mêmes numéros que le fichier réel : ces lignes sont refusées (« existe déjà sur
  un autre booking »). Supprimer les conteneurs de démo concernés puis relancer.
- 2 numéros de téléphone maximum par client (`phone`, `phone_2`) : les suivants sont
  signalés en avertissement et ignorés.
- Les fichiers réels et les journaux ne doivent jamais être commités (données clients).
