# ADR 0002 — Backend organisé en couches (MVC + services)

- **Statut** : accepté — 2026-10-09
- **Contexte** : le module auth sert de référence (CLAUDE.md) : un fichier par
  responsabilité (routes, controller, service, model, validation).
- **Décision** : conserver l'organisation par couches (`routes/`, `controllers/`,
  `services/`, `models/`, `validations/`), chaque dossier avec ses `__tests__/`.
- **Alternative écartée pour l'instant** : un découpage par fonctionnalité
  (`src/modules/bookings/…`). À réévaluer au début de la Phase 3, quand clients,
  flotte et carburant s'ajouteront : ce serait un déplacement de fichiers sans
  changement de code, à faire dans une PR dédiée, jamais au milieu d'un jalon.
