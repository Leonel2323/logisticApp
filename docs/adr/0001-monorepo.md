# ADR 0001 — Un seul dépôt (monorepo) pour les trois applications

- **Statut** : accepté — 2026-10-09
- **Contexte** : frontend, backend et ai-service évoluent ensemble, livrés par jalons
  (v0.1-auth, v0.2-metier…), par un développeur seul.
- **Décision** : un monorepo, un dossier par application, chacune avec ses propres
  dépendances (`package-lock.json` / `requirements.txt`). Pas de npm workspaces pour
  l'instant : ils fusionneraient les lockfiles sans bénéfice actuel.
- **Conséquences** : une PR peut couvrir l'API et l'écran d'une même fonctionnalité ;
  la CI ne lance que les jobs des applications modifiées (`dorny/paths-filter`).
  À revoir si une application doit être déployée ou versionnée indépendamment.
