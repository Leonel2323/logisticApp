/**
 * @typedef {Object} TableColumn
 * @property {string} key - Clé de la colonne (propriété de chaque ligne), sauf si `render` est fourni.
 * @property {string} label - Libellé affiché dans l'en-tête de colonne.
 * @property {(row: Object) => import('react').ReactNode} [render] - Rendu personnalisé de la cellule ; reçoit la ligne complète.
 */

/**
 * Tableau générique et réutilisable : aucune colonne ni logique spécifique
 * à une ressource n'est codée en dur ici.
 *
 * @param {Object} props
 * @param {TableColumn[]} props.columns
 * @param {Object[]} props.data
 * @param {boolean} [props.loading=false]
 * @param {string} [props.emptyMessage='Aucune donnée.']
 */
export default function Table({ columns, data, loading = false, emptyMessage = 'Aucune donnée.' }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-left font-medium text-slate-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white" aria-busy={loading}>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
                    aria-hidden="true"
                  />
                  Chargement...
                </span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={row.id ?? index} className="odd:bg-white even:bg-slate-50/60 hover:bg-slate-100">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
