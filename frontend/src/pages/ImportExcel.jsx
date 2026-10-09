import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCommitExcelImport, usePreviewExcelImport } from '../hooks/useImports';
import StatusBadge from '../components/StatusBadge';
import Table from '../components/Table';

// Mêmes limites que le backend (middleware uploadExcel), vérifiées avant l'envoi.
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ROW_COLORS = {
  new: 'bg-green-50 text-green-700 ring-green-600/20',
  existing: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
};
const PREVIEW_LABELS = { new: 'À créer', existing: 'Déjà présent', error: 'Erreur' };
const RESULT_LABELS = { new: 'Créé', existing: 'Déjà présent', error: 'Erreur' };

function formatSize(bytes) {
  const format = (value) => value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  if (bytes >= 1024 * 1024) return `${format(bytes / 1024 / 1024)} Mo`;
  return `${format(bytes / 1024)} Ko`;
}

function checkFile(file) {
  if (!/\.xlsx$/i.test(file.name)) return 'Seuls les fichiers Excel .xlsx sont acceptés.';
  if (file.size > MAX_FILE_SIZE) return 'Fichier trop volumineux (5 Mo maximum).';
  return null;
}

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}

function Summary({ report }) {
  const { created } = report;
  const items = [
    { label: 'Bookings', value: created.bookings },
    { label: 'Conteneurs', value: created.containers },
    { label: 'Mouvements IN', value: created.movements },
    { label: 'Clients', value: created.clients },
    // Clients existants dont un emplacement de téléphone vide a été rempli.
    ...(report.updated?.clients ? [{ label: 'Clients complétés', value: report.updated.clients }] : []),
    { label: 'Véhicules', value: created.tractors + created.trailers },
    { label: 'Déjà présents', value: report.skipped },
    { label: 'Erreurs', value: report.errors.length, alert: report.errors.length > 0 },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-slate-600">{report.dryRun ? 'À créer' : 'Créés'}</p>
      <ul aria-label="Résumé" className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {items.map((item) => (
          <li key={item.label} className="flex flex-col rounded-lg border border-slate-200 bg-white p-3">
            <span className="text-xs font-medium text-slate-500">{item.label}</span>
            <span
              className={`mt-1 text-2xl font-semibold tabular-nums ${item.alert ? 'text-red-700' : 'text-slate-900'}`}
            >
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ImportExcel() {
  const { user } = useAuth();
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [errorsOnly, setErrorsOnly] = useState(false);

  const preview = usePreviewExcelImport();
  const commit = useCommitExcelImport();

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-slate-800">Import Excel</h1>
        <p role="alert" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          L'import Excel est réservé aux administrateurs.
        </p>
      </div>
    );
  }

  function resetResults() {
    preview.reset();
    commit.reset();
    setErrorsOnly(false);
  }

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    resetResults();
    if (!chosen) {
      setFile(null);
      setFileError(null);
      return;
    }
    const error = checkFile(chosen);
    setFileError(error);
    setFile(error ? null : chosen);
  }

  // Une nouvelle analyse remplace le résultat d'un import précédent.
  function handleAnalyse() {
    commit.reset();
    setErrorsOnly(false);
    preview.mutate(file);
  }

  function handleRestart() {
    resetResults();
    setFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const result = commit.data ?? preview.data;
  const report = result?.report;
  const isResult = Boolean(commit.data);
  const nothingToImport = report ? Object.values(report.created).every((count) => count === 0) : true;
  const visibleRows = report ? (errorsOnly ? report.rows.filter((row) => row.status === 'error') : report.rows) : [];

  const columns = [
    { key: 'row', label: 'Ligne' },
    { key: 'container_number', label: 'N° conteneur', render: (row) => row.container_number ?? '—' },
    { key: 'booking_number', label: 'Booking', render: (row) => row.booking_number ?? '—' },
    { key: 'client', label: 'Client', render: (row) => row.client ?? '—' },
    {
      key: 'status',
      label: 'Statut',
      render: (row) => (
        <StatusBadge status={row.status} colorMap={ROW_COLORS} labelMap={isResult ? RESULT_LABELS : PREVIEW_LABELS} />
      ),
    },
    { key: 'movement', label: 'Mouvement IN', render: (row) => (row.movement ? 'Oui' : '—') },
    {
      key: 'message',
      label: 'Détail',
      render: (row) => (row.message ? <span className="text-red-700">{row.message}</span> : null),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Import Excel</h1>
        <p className="mt-1 text-sm text-slate-600">
          Importez le fichier de suivi des bookings (.xlsx). Il est d'abord analysé : rien n'est enregistré avant votre
          confirmation.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1">
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            Fichier Excel (.xlsx)
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-describedby={hintId}
            aria-invalid={Boolean(fileError)}
            onChange={handleFileChange}
            disabled={preview.isPending || commit.isPending}
            className="block w-full text-sm text-slate-600 file:mr-4 file:min-h-11 file:cursor-pointer file:rounded file:border-0 file:bg-slate-100 file:px-4 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p id={hintId} className="text-xs text-slate-500">
            5 Mo et 100 lignes maximum. La feuille doit contenir la ligne d'en-tête DATE, HEURE, N°TC, TYPE TC, N° BOOKING…
          </p>
        </div>

        {file && (
          <p className="text-sm text-slate-700">
            <span className="font-medium">{file.name}</span> <span className="text-slate-500">{formatSize(file.size)}</span>
          </p>
        )}

        {fileError && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {fileError}
          </p>
        )}
        {preview.error && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {preview.error.message}
          </p>
        )}

        <button
          type="button"
          onClick={handleAnalyse}
          disabled={!file || preview.isPending || commit.isPending}
          className="flex min-h-11 items-center justify-center gap-2 rounded bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {preview.isPending && <Spinner />}
          {preview.isPending ? 'Analyse en cours...' : 'Analyser le fichier'}
        </button>
      </section>

      {report && (
        <section aria-labelledby="import-report-title" className="space-y-4">
          <div>
            <h2 id="import-report-title" className="text-lg font-semibold text-slate-800">
              {isResult ? "Résultat de l'import" : 'Aperçu'}
            </h2>
            {isResult ? (
              <p role="status" className="mt-1 text-sm font-medium text-green-700">
                Import terminé.
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                Aucune donnée n'a encore été enregistrée. Vérifiez le résumé puis confirmez l'import.
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Feuille « {result.file.sheetName} », lignes {result.file.headerRow + 1} à {result.file.endRow}
              {result.file.ignoredBelow > 0 &&
                ` · ${result.file.ignoredBelow} ligne(s) sous le tableau ignorée(s) (autres tableaux de la feuille).`}
            </p>
          </div>

          <Summary report={report} />

          {report.warnings.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {report.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}

          {report.errors.length > 0 && (
            <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={errorsOnly}
                onChange={(event) => setErrorsOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Afficher uniquement les erreurs ({report.errors.length})
            </label>
          )}

          <Table columns={columns} data={visibleRows} emptyMessage="Aucune ligne." />

          {commit.error && (
            <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {commit.error.message}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {isResult ? (
              <>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex min-h-11 items-center justify-center rounded border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Importer un autre fichier
                </button>
                <Link
                  to="/bookings"
                  className="flex min-h-11 items-center justify-center rounded bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Voir les bookings
                </Link>
              </>
            ) : (
              <>
                {nothingToImport && (
                  <p className="text-sm text-slate-600">Rien de nouveau à importer : tout est déjà en base.</p>
                )}
                <button
                  type="button"
                  onClick={() => commit.mutate(file)}
                  disabled={nothingToImport || !file || commit.isPending}
                  className="flex min-h-11 items-center justify-center gap-2 rounded bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {commit.isPending && <Spinner />}
                  {commit.isPending ? 'Import en cours...' : 'Importer'}
                </button>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
