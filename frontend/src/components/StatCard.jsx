/**
 * Carte d'indicateur réutilisable. `code` sert de nom accessible (aria-label)
 * et est aussi affiché, pour que le libellé lu et le libellé vu coïncident.
 *
 * @param {Object} props
 * @param {string} props.code - Nom accessible exact, ex. "QTE_BK".
 * @param {string} props.label - Libellé lisible, ex. "Quantité prévue".
 * @param {number|string} props.value
 * @param {string} [props.hint] - Information secondaire sous la valeur.
 */
export default function StatCard({ code, label, value, hint }) {
  return (
    <div role="group" aria-label={code} className="rounded-lg border border-slate-200 bg-white p-4">
      <span className="label block text-sm font-medium text-slate-600">{label}</span>
      <span className="value mt-1 block text-3xl font-semibold tabular-nums text-slate-900">{value}</span>
      <span className="mt-1 block font-mono text-xs text-slate-500">
        {code}
        {hint && <span className="font-sans"> · {hint}</span>}
      </span>
    </div>
  );
}
