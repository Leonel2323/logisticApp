/**
 * Pagination générique et réutilisable.
 *
 * @param {Object} props
 * @param {number} props.page - Page courante (1-indexée).
 * @param {number} props.limit - Nombre d'éléments par page.
 * @param {number} props.total - Nombre total d'éléments.
 * @param {(page: number) => void} props.onPageChange
 * @param {(limit: number) => void} [props.onLimitChange] - Nécessaire pour activer le sélecteur de limite ;
 *   non listé dans la spec d'origine mais indispensable pour que ce sélecteur ait un effet. Si absent, le
 *   sélecteur n'est simplement pas affiché.
 * @param {number[]} [props.limitOptions=[10, 20, 50]]
 */
export default function Pagination({ page, limit, total, onPageChange, onLimitChange, limitOptions = [10, 20, 50] }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          aria-label="Page précédente"
          className="min-h-11 min-w-11 rounded border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>
        <span aria-live="polite">
          Page {page} sur {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          aria-label="Page suivante"
          className="min-h-11 min-w-11 rounded border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>

      {onLimitChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="pagination-limit" className="whitespace-nowrap">
            Lignes par page
          </label>
          <select
            id="pagination-limit"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="min-h-11 rounded border border-slate-300 px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
