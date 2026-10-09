import { Link, useParams } from 'react-router-dom';
import { useBookingStats } from '../hooks/useBookings';
import { useContainers, useMarkContainerProcessed } from '../hooks/useContainers';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Table from '../components/Table';

// Limite max acceptée par GET /api/containers.
const CONTAINERS_LIMIT = 100;

// Textes exacts attendus (role="alert").
const ALERTS = [
  { key: 'is_late', text: 'en retard', tone: 'border-red-200 bg-red-50 text-red-700' },
  { key: 'is_almost_done', text: 'presque terminé', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  { key: 'is_empty', text: 'aucun conteneur', tone: 'border-slate-200 bg-slate-100 text-slate-700' },
];

const PROCESSED_COLORS = {
  traite: 'bg-green-50 text-green-700 ring-green-600/20',
  en_attente: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};
const PROCESSED_LABELS = { traite: 'Traité', en_attente: 'En attente' };

const DETAIL_COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'qte_bk', label: 'QTE_BK' },
  { key: 'qte_enl', label: 'QTE_ENL' },
  { key: 'solde', label: 'SOLDE' },
  { key: 'pct', label: '%', render: (row) => `${row.pct}%` },
];

// Les dates arrivent en "YYYY-MM-DD" : on les découpe plutôt que de passer par
// new Date(), qui les interpréterait en UTC et pourrait afficher la veille.
function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const { data: stats, isLoading, isError, error } = useBookingStats(id);
  const { data: containersData, isLoading: containersLoading } = useContainers({
    booking_id: id,
    limit: CONTAINERS_LIMIT,
  });
  const markProcessed = useMarkContainerProcessed();

  const backLink = (
    <Link
      to="/bookings"
      className="inline-block rounded text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      ← Retour à la liste des bookings
    </Link>
  );

  if (isLoading) {
    return (
      <div>
        {backLink}
        <p role="status" className="mt-6 flex items-center gap-2 text-slate-500">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
            aria-hidden="true"
          />
          Chargement...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        {backLink}
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error?.message || 'Impossible de charger le booking.'}
        </p>
      </div>
    );
  }

  const { booking, details, total, alerts } = stats;
  const activeAlerts = ALERTS.filter((alert) => alerts[alert.key]);
  const containers = containersData?.containers ?? [];
  const containersTotal = containersData?.pagination?.total ?? containers.length;

  const containerColumns = [
    { key: 'container_number', label: 'N° conteneur' },
    { key: 'type', label: 'Type' },
    { key: 'state', label: 'État' },
    {
      key: 'is_processed',
      label: 'Statut',
      render: (row) => (
        <StatusBadge
          status={row.is_processed ? 'traite' : 'en_attente'}
          colorMap={PROCESSED_COLORS}
          labelMap={PROCESSED_LABELS}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        if (row.is_processed) return null;
        const pending = markProcessed.isPending && markProcessed.variables?.id === row.id;
        return (
          <button
            type="button"
            onClick={() => markProcessed.mutate({ id: row.id, data: {} })}
            disabled={markProcessed.isPending}
            className="min-h-11 rounded border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Traitement...' : 'Marquer traité'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-800">{booking.booking_number}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {booking.shipping_company} · {booking.client?.name ?? 'Sans client'} · du {formatDate(booking.start_date)}{' '}
            au {formatDate(booking.end_date)}
          </p>
        </div>
        <Link
          to={`/containers/new?booking_id=${id}`}
          className="flex min-h-11 items-center rounded bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Ajouter un conteneur
        </Link>
      </div>

      {activeAlerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeAlerts.map((alert) => (
            <p
              key={alert.key}
              role="alert"
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${alert.tone}`}
            >
              <WarningIcon />
              {alert.text}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard code="QTE_BK" label="Quantité prévue" value={total.qte_bk} />
        <StatCard code="QTE_ENL" label="Quantité enlevée" value={total.qte_enl} hint={`${total.pct}% enlevés`} />
        <StatCard code="SOLDE" label="Solde restant" value={total.solde} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Détail par type</h2>
        <Table columns={DETAIL_COLUMNS} data={details} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Conteneurs</h2>
        <Table
          columns={containerColumns}
          data={containers}
          loading={containersLoading}
          emptyMessage="Aucun conteneur pour ce booking."
        />
        {containersTotal > containers.length && (
          <p className="mt-2 text-xs text-slate-500">
            Affichage des {containers.length} premiers conteneurs sur {containersTotal}.
          </p>
        )}
      </section>
    </div>
  );
}
