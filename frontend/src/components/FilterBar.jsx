import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;

/**
 * @typedef {Object} FilterFieldOption
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {Object} FilterField
 * @property {string} key - Clé du filtre (correspond à une entrée de `filters`).
 * @property {string} label - Libellé affiché au-dessus du champ.
 * @property {'select'|'text'} type
 * @property {FilterFieldOption[]} [options] - Requis si `type === 'select'`.
 * @property {string} [placeholder]
 */

/**
 * Barre de filtres générique et réutilisable : le jeu de champs affichés est
 * entièrement défini par `fields`, pas codé en dur pour une ressource donnée.
 * Pour la page Bookings, `fields` sera par exemple :
 * [
 *   { key: 'status', label: 'Statut', type: 'select', options: [
 *       { value: 'en_cours', label: 'En cours' },
 *       { value: 'cloture', label: 'Clôturé' },
 *       { value: 'retard', label: 'En retard' },
 *     ] },
 *   { key: 'shipping_company', label: 'Compagnie maritime', type: 'select', options: [...] },
 *   { key: 'client_id', label: 'Client', type: 'select', options: [...] },
 *   { key: 'search', label: 'Recherche', type: 'text', placeholder: 'Numéro, compagnie...' },
 * ]
 *
 * @param {Object} props
 * @param {FilterField[]} props.fields
 * @param {Object<string, string>} props.filters - Valeurs courantes, indexées par `key` de champ.
 * @param {(key: string, value: string) => void} props.onFilterChange
 * @param {() => void} props.onReset
 */
export default function FilterBar({ fields, filters, onFilterChange, onReset }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      {fields.map((field) =>
        field.type === 'select' ? (
          <SelectFilter key={field.key} field={field} value={filters[field.key] ?? ''} onChange={onFilterChange} />
        ) : (
          <TextFilter key={field.key} field={field} value={filters[field.key] ?? ''} onChange={onFilterChange} />
        )
      )}
      <button
        type="button"
        onClick={onReset}
        className="min-h-11 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        Réinitialiser
      </button>
    </div>
  );
}

function SelectFilter({ field, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`filter-${field.key}`} className="text-xs font-medium text-slate-600">
        {field.label}
      </label>
      <select
        id={`filter-${field.key}`}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        className="min-h-11 rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <option value="">{field.placeholder || 'Tous'}</option>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextFilter({ field, value, onChange }) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  // Si la valeur externe change (ex: onReset côté parent), on resynchronise
  // l'affichage et on annule tout debounce en vol pour éviter qu'il écrase
  // la réinitialisation avec une saisie désormais obsolète.
  useEffect(() => {
    setLocalValue(value);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const next = e.target.value;
    setLocalValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(field.key, next), DEBOUNCE_MS);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`filter-${field.key}`} className="text-xs font-medium text-slate-600">
        {field.label}
      </label>
      <input
        id={`filter-${field.key}`}
        type="text"
        value={localValue}
        placeholder={field.placeholder}
        onChange={handleChange}
        className="min-h-11 rounded border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      />
    </div>
  );
}
