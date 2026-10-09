const DEFAULT_COLOR_MAP = {
  en_cours: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cloture: 'bg-green-50 text-green-700 ring-green-600/20',
  retard: 'bg-red-50 text-red-700 ring-red-600/20',
};

const DEFAULT_LABEL_MAP = {
  en_cours: 'En cours',
  cloture: 'Clôturé',
  retard: 'En retard',
};

/**
 * Badge de statut générique et réutilisable. Par défaut, couleurs/libellés
 * des statuts de booking (en_cours=bleu, cloture=vert, retard=rouge) ;
 * passer `colorMap`/`labelMap` pour réutiliser ce composant avec d'autres
 * statuts (véhicules, conteneurs, etc.).
 *
 * @param {Object} props
 * @param {string} props.status
 * @param {Object<string, string>} [props.colorMap=DEFAULT_COLOR_MAP]
 * @param {Object<string, string>} [props.labelMap=DEFAULT_LABEL_MAP]
 */
export default function StatusBadge({ status, colorMap = DEFAULT_COLOR_MAP, labelMap = DEFAULT_LABEL_MAP }) {
  const classes = colorMap[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20';
  const label = labelMap[status] || status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {label}
    </span>
  );
}
