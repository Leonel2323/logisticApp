import { useId, useMemo, useState } from 'react';
import { useBooking, useBookings } from '../hooks/useBookings';
import { useClients } from '../hooks/useClients';

/**
 * Sélecteur de booking avec recherche intégrée (filtre côté client).
 * Affiche chaque option au format « N° booking — Compagnie — Client ».
 * Charge les 100 bookings les plus récents via `useBookings()` (limite max
 * acceptée par l'API) ; au-delà, affiner la recherche réduit la liste visible
 * mais ne relance pas de requête serveur.
 *
 * @param {Object} props
 * @param {number|string} [props.value] - id du booking sélectionné
 * @param {(id: number) => void} props.onChange
 * @param {string} [props.error] - Message d'erreur à afficher.
 * @param {string} [props.hint] - Message d'information discret sous le champ.
 */
export default function BookingSelect({ value, onChange, error, hint }) {
  const listboxId = useId();
  const hintId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data, isLoading: loadingBookings } = useBookings({ limit: 100 });
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const loading = loadingBookings || loadingClients;

  const bookings = data?.bookings ?? [];
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  function labelFor(booking) {
    const clientName = clientsById.get(booking.client_id)?.name ?? `#${booking.client_id}`;
    return `${booking.booking_number} — ${booking.shipping_company} — ${clientName}`;
  }

  // Un booking présélectionné peut être plus ancien que les 100 chargés : on le
  // récupère alors individuellement pour pouvoir afficher son libellé.
  const selectedInList = bookings.find((booking) => String(booking.id) === String(value));
  const { data: selectedFallback } = useBooking(value && !loading && !selectedInList ? value : null);
  const selected = selectedInList ?? selectedFallback;

  const filtered = useMemo(() => {
    if (!query) return bookings;
    const q = query.toLowerCase();
    return bookings.filter((booking) => labelFor(booking).toLowerCase().includes(q));
  }, [bookings, query, clientsById]);

  function handleSelect(booking) {
    onChange(booking.id);
    setQuery('');
    setOpen(false);
  }

  const displayValue = open ? query : selected ? labelFor(selected) : '';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="booking-select" className="text-sm font-medium text-slate-700">
        Booking
      </label>
      <div className="relative">
        <input
          id="booking-select"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={hint ? hintId : undefined}
          autoComplete="off"
          disabled={loading}
          value={displayValue}
          placeholder={loading ? 'Chargement...' : 'Rechercher un booking...'}
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
              <li className="px-3 py-2 text-sm text-slate-500">Aucun booking trouvé.</li>
            ) : (
              filtered.map((booking) => (
                <li key={booking.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={String(booking.id) === String(value)}
                    onClick={() => handleSelect(booking)}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                  >
                    {labelFor(booking)}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
