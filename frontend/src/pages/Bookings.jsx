import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useBookings, useDeleteBooking, useShippingCompanies } from '../hooks/useBookings';
import { useClients } from '../hooks/useClients';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_OPTIONS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'cloture', label: 'Clôturé' },
  { value: 'retard', label: 'En retard' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function Bookings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filters = useMemo(() => {
    const result = {};
    ['status', 'shipping_company', 'client_id', 'search'].forEach((key) => {
      const value = searchParams.get(key);
      if (value) result[key] = value;
    });
    result.page = Number(searchParams.get('page')) || 1;
    result.limit = Number(searchParams.get('limit')) || 20;
    return result;
  }, [searchParams]);

  const { data, isLoading, isError, error, refetch } = useBookings(filters);
  const deleteBooking = useDeleteBooking();
  const { data: clients = [] } = useClients();
  const { data: shippingCompanies = [] } = useShippingCompanies();

  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  function clientLabel(clientId) {
    return clientsById.get(clientId)?.name ?? `#${clientId}`;
  }

  const filterFields = useMemo(
    () => [
      { key: 'status', label: 'Statut', type: 'select', options: STATUS_OPTIONS },
      {
        key: 'shipping_company',
        label: 'Compagnie maritime',
        type: 'select',
        options: shippingCompanies.map((company) => ({ value: company, label: company })),
      },
      {
        key: 'client_id',
        label: 'Client',
        type: 'select',
        options: clients.map((client) => ({ value: String(client.id), label: client.name })),
      },
      { key: 'search', label: 'Recherche', type: 'text', placeholder: 'N° booking, compagnie...' },
    ],
    [shippingCompanies, clients]
  );

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next);
  }

  function handleFilterChange(key, value) {
    updateParams({ [key]: value, page: 1 });
  }

  function handleReset() {
    setSearchParams({});
  }

  function openDeleteDialog(row) {
    setDeleteError(null);
    setDeleteTarget(row);
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
    setDeleteError(null);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteBooking.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => setDeleteError(err.message || 'Suppression impossible.'),
    });
  }

  const bookings = data?.bookings ?? [];
  const pagination = data?.pagination ?? { page: filters.page, limit: filters.limit, total: 0 };

  const columns = [
    {
      key: 'booking_number',
      label: 'N° Booking',
      render: (row) => (
        <Link
          to={`/bookings/${row.id}`}
          className="rounded font-medium text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          {row.booking_number}
        </Link>
      ),
    },
    { key: 'shipping_company', label: 'Compagnie maritime' },
    { key: 'client_id', label: 'Client', render: (row) => clientLabel(row.client_id) },
    { key: 'start_date', label: 'Date début', render: (row) => formatDate(row.start_date) },
    { key: 'end_date', label: 'Date fin', render: (row) => formatDate(row.end_date) },
    { key: 'status', label: 'Statut', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <Link
            to={`/bookings/${row.id}`}
            className="rounded text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Voir
          </Link>
          <Link
            to={`/bookings/${row.id}/edit`}
            className="rounded text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Modifier
          </Link>
          <button
            type="button"
            onClick={() => openDeleteDialog(row)}
            className="rounded text-sm font-medium text-red-600 hover:text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800">Bookings</h1>
        <button
          type="button"
          onClick={() => navigate('/bookings/new')}
          className="min-h-11 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Nouveau booking
        </button>
      </div>

      <div className="mt-4">
        <FilterBar fields={filterFields} filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />
      </div>

      <div className="mt-4">
        {isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error?.message || 'Impossible de charger les bookings.'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 min-h-11 rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            {/* Desktop/tablette : tableau */}
            <div className="hidden sm:block">
              <Table columns={columns} data={bookings} loading={isLoading} emptyMessage="Aucun booking trouvé." />
            </div>

            {/* Mobile : cartes */}
            <div className="sm:hidden">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-10 text-slate-500">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
                    aria-hidden="true"
                  />
                  Chargement...
                </div>
              ) : bookings.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white py-10 text-center text-slate-500">
                  Aucun booking trouvé.
                </div>
              ) : (
                <div className="grid gap-3">
                  {bookings.map((row) => (
                    <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/bookings/${row.id}`}
                          className="rounded font-medium text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          {row.booking_number}
                        </Link>
                        <StatusBadge status={row.status} />
                      </div>
                      <dl className="mt-3 space-y-1 text-sm text-slate-600">
                        <div className="flex justify-between gap-2">
                          <dt>Compagnie</dt>
                          <dd className="text-right">{row.shipping_company}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Client</dt>
                          <dd className="text-right">{clientLabel(row.client_id)}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Début</dt>
                          <dd className="text-right">{formatDate(row.start_date)}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Fin</dt>
                          <dd className="text-right">{formatDate(row.end_date)}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                        <Link
                          to={`/bookings/${row.id}`}
                          className="flex min-h-11 flex-1 items-center justify-center rounded border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          Voir
                        </Link>
                        <Link
                          to={`/bookings/${row.id}/edit`}
                          className="flex min-h-11 flex-1 items-center justify-center rounded border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(row)}
                          className="min-h-11 flex-1 rounded border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={(page) => updateParams({ page })}
              onLimitChange={(limit) => updateParams({ limit, page: 1 })}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer ce booking ?"
        message={
          deleteTarget
            ? `Le booking "${deleteTarget.booking_number}" sera définitivement supprimé. Cette action est irréversible.`
            : ''
        }
        confirmLabel="Supprimer"
        loading={deleteBooking.isPending}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => closeDeleteDialog()}
      />
    </div>
  );
}
