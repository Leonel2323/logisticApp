import { useId, useMemo, useState } from 'react';
import { useClients } from '../hooks/useClients';

/**
 * Sélecteur de client avec recherche intégrée (filtre côté client).
 * Affiche chaque option au format « Nom (Code) ».
 *
 * @param {Object} props
 * @param {number|string} [props.value] - id du client sélectionné
 * @param {(id: number) => void} props.onChange
 * @param {string} [props.error] - Message d'erreur à afficher.
 */
export default function ClientSelect({ value, onChange, error }) {
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data: clients = [], isLoading: loading } = useClients();

  function labelFor(client) {
    return `${client.name} (${client.code})`;
  }

  const selected = clients.find((client) => String(client.id) === String(value));

  const filtered = useMemo(() => {
    if (!query) return clients;
    const q = query.toLowerCase();
    return clients.filter((client) => labelFor(client).toLowerCase().includes(q));
  }, [clients, query]);

  function handleSelect(client) {
    onChange(client.id);
    setQuery('');
    setOpen(false);
  }

  const displayValue = open ? query : selected ? labelFor(selected) : '';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="client-select" className="text-sm font-medium text-slate-700">
        Client
      </label>
      <div className="relative">
        <input
          id="client-select"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          disabled={loading}
          value={displayValue}
          placeholder={loading ? 'Chargement...' : 'Rechercher un client...'}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          className={`min-h-11 w-full rounded border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            error ? 'border-red-400' : 'border-slate-300'
          }`}
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
            aria-hidden="true"
          />
        )}
        {open && !loading && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">Aucun client trouvé.</li>
            ) : (
              filtered.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={String(client.id) === String(value)}
                    onClick={() => handleSelect(client)}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                  >
                    {labelFor(client)}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
