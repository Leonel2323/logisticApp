/**
 * Import du fichier Excel SOBRO en ligne de commande. La logique d'import est
 * dans src/services/excelImportService.js (partagée avec POST /api/imports/excel).
 *
 * Usage : npm run import:excel [-- [--dry-run] chemin/vers/fichier.xlsx]
 * Sans chemin, utilise l'unique fichier .xlsx présent dans backend/data/.
 * --dry-run : aperçu (contrôles + compteurs) sans aucune écriture en base.
 */
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const { readWorkbook, importRows } = require('../src/services/excelImportService');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LOG_DIR = path.join(__dirname, '..', 'logs');

/**
 * Chemin du fichier à importer : celui passé en argument, sinon l'unique .xlsx
 * du dossier data/. Lève une erreur si le fichier est absent ou ambigu.
 */
function resolveFilePath(arg, dataDir = DATA_DIR) {
  if (arg) {
    const filePath = path.resolve(arg);
    if (!fs.existsSync(filePath)) throw new Error(`Fichier introuvable : ${filePath}`);
    return filePath;
  }

  const files = fs.existsSync(dataDir)
    ? fs.readdirSync(dataDir).filter((name) => /\.xlsx$/i.test(name) && !name.startsWith('~$'))
    : [];
  if (files.length === 0) throw new Error(`Aucun fichier .xlsx dans ${dataDir}.`);
  if (files.length > 1) {
    throw new Error(`Plusieurs fichiers .xlsx dans ${dataDir} (${files.join(', ')}) : précisez lequel en argument.`);
  }
  return path.join(dataDir, files[0]);
}

function createProgressBar(width = 30) {
  let lastStep = -1;
  return (done, total) => {
    const ratio = total ? done / total : 1;
    const percent = Math.round(ratio * 100);
    if (process.stdout.isTTY) {
      const filled = Math.round(ratio * width);
      process.stdout.write(`\r[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${percent}% (${done}/${total})`);
      if (done === total) process.stdout.write('\n');
    } else if (Math.floor(percent / 10) !== lastStep || done === total) {
      lastStep = Math.floor(percent / 10);
      console.log(`Progression : ${percent}% (${done}/${total})`);
    }
  };
}

function printReport(report, logFile) {
  const { created } = report;
  const verb = report.dryRun ? 'à créer' : 'créés';
  console.log(report.dryRun ? '\n===== Aperçu (aucune écriture) =====' : "\n===== Rapport d'import =====");
  console.log(`Lignes lues             : ${report.total}`);
  console.log(`Bookings ${verb}       : ${created.bookings}`);
  console.log(`Conteneurs ${verb}     : ${created.containers}`);
  console.log(`Conteneurs déjà présents: ${report.skipped}`);
  console.log(`Clients ${verb}        : ${created.clients}`);
  console.log(`Clients complétés (tél.): ${report.updated.clients}`);
  console.log(`Véhicules ${verb}      : ${created.tractors + created.trailers} (TRACTEUR ${created.tractors} + REMORQUE ${created.trailers})`);
  console.log(`Mouvements IN ${verb}  : ${created.movements}`);
  console.log(`Erreurs                 : ${report.errors.length}`);

  if (report.warnings.length) {
    console.log('\nAvertissements :');
    report.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }
  if (report.errors.length) {
    console.log('\nDétail des erreurs :');
    report.errors.forEach(({ row, message }) => console.log(`  - Ligne ${row} : ${message}`));
  }
  console.log(`\nJournal complet : ${logFile}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filePath = resolveFilePath(args.find((arg) => !arg.startsWith('--')));
  console.log(`Fichier : ${filePath}${dryRun ? ' (aperçu)' : ''}`);

  const { sheetName, headerRow, endRow, ignoredBelow, rows } = await readWorkbook(filePath);
  console.log(`Feuille "${sheetName}" : ${rows.length} ligne(s) de données (lignes ${headerRow + 1} à ${endRow}).`);
  if (ignoredBelow) {
    console.log(`${ignoredBelow} ligne(s) non vide(s) sous le tableau ignorée(s) (autres tableaux de la feuille).`);
  }
  if (rows.length === 0) return;

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(LOG_DIR, `import-excel-${stamp}${dryRun ? '-apercu' : ''}.log`);
  const logStream = fs.createWriteStream(logFile);

  const report = await importRows(rows, {
    dryRun,
    log: (line) => logStream.write(`${line}\n`),
    onProgress: createProgressBar(),
  });

  report.warnings.forEach((warning) => logStream.write(`AVERTISSEMENT ${warning}\n`));
  await new Promise((resolve) => logStream.end(resolve));
  printReport(report, logFile);
  if (report.errors.length) process.exitCode = 1;
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(`\nImport interrompu : ${err.message}`);
      process.exitCode = 1;
    })
    .finally(() => db.destroy());
}

module.exports = { resolveFilePath };
