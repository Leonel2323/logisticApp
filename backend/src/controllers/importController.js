const { readWorkbook, importRows } = require('../services/excelImportService');
const { success, failure } = require('../utils/apiResponse');

// Une ligne nouvelle coûte ~1,8 s (une dizaine d'allers-retours Supabase via les
// modèles) : 100 lignes ≈ 3 min, sous le délai de 5 min d'une requête Node.
// Au-delà, le script CLI (sans délai) est la voie prévue.
const MAX_IMPORT_ROWS = 100;

// Un seul import réel à la fois : deux imports simultanés du même fichier
// pourraient créer deux fois le même client ou booking. Les aperçus
// n'écrivent rien et restent possibles pendant un import.
let commitInProgress = false;

/**
 * POST /api/imports/excel?mode=preview|commit (multipart, champ "file").
 * preview : contrôles et compteurs sans écriture ; commit : import réel.
 */
async function excel(req, res, next) {
  const dryRun = req.query.mode !== 'commit';
  if (!dryRun && commitInProgress) {
    return failure(res, 'Un import est déjà en cours. Réessayez dans quelques instants.', 409);
  }
  if (!dryRun) commitInProgress = true;

  try {
    const { rows, ...sheet } = await readWorkbook(req.file.buffer);
    if (rows.length === 0) return failure(res, "Aucune ligne de données sous l'en-tête.", 400);
    if (rows.length > MAX_IMPORT_ROWS) {
      return failure(
        res,
        `Trop de lignes (${rows.length}) : ${MAX_IMPORT_ROWS} maximum par import depuis l'application. ` +
          'Découpez le fichier ou utilisez le script npm run import:excel.',
        400
      );
    }

    const report = await importRows(rows, { dryRun });
    if (!dryRun) {
      const { created } = report;
      console.info(
        `[import-excel] utilisateur #${req.user.id} : ${created.bookings} booking(s), ${created.containers} conteneur(s), ` +
          `${created.movements} mouvement(s) IN, ${report.errors.length} erreur(s).`
      );
    }

    return success(res, { file: { name: req.file.originalname, ...sheet }, report });
  } catch (err) {
    return next(err);
  } finally {
    if (!dryRun) commitInProgress = false;
  }
}

module.exports = { excel, MAX_IMPORT_ROWS };
