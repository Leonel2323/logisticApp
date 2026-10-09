import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookingDetail from '../BookingDetail';

// Seuls les hooks de données sont simulés : la page et ses composants
// (StatCard, Table, StatusBadge...) sont rendus pour de vrai.
const { useBookingStats, useContainers, useMarkContainerProcessed, markProcessedMutate } = vi.hoisted(() => ({
  useBookingStats: vi.fn(),
  useContainers: vi.fn(),
  useMarkContainerProcessed: vi.fn(),
  markProcessedMutate: vi.fn(),
}));

vi.mock('../../hooks/useBookings', () => ({ useBookingStats }));
vi.mock('../../hooks/useContainers', () => ({ useContainers, useMarkContainerProcessed }));

// Même forme que GET /api/bookings/:id/stats.
function statsFixture(alerts = {}) {
  return {
    booking: {
      id: 103,
      booking_number: 'BK9900001',
      shipping_company: 'MAERSK',
      client: { id: 5, name: 'CLIENT ALPHA' },
      start_date: '2026-04-01',
      end_date: '2026-04-15',
      status: 'en_cours',
    },
    details: [
      { type: '40FT', qte_bk: 10, qte_enl: 7, solde: 3, pct: 70 },
      { type: '20FT', qte_bk: 11, qte_enl: 5, solde: 6, pct: 45 },
      { type: '10FT', qte_bk: 2, qte_enl: 0, solde: 2, pct: 0 },
    ],
    total: { qte_bk: 23, qte_enl: 12, solde: 11, pct: 52 },
    alerts: { is_late: false, is_almost_done: false, is_empty: false, ...alerts },
  };
}

const CONTAINERS = [
  { id: 501, container_number: 'MSCU0000001', type: '40FT', state: 'PLEIN', is_processed: false },
  { id: 502, container_number: 'MSCU0000002', type: '20FT', state: 'VIDE', is_processed: true },
];

function mockStats(data) {
  useBookingStats.mockReturnValue({ data, isLoading: false, isError: false, error: null });
}

function LocationDisplay() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bookings/103']}>
      <Routes>
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/containers/new" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );
}

// Le tableau "détails" est repéré par ses en-têtes (QTE_BK...), pour le
// distinguer du tableau des conteneurs.
function detailsTable() {
  const table = screen
    .getAllByRole('table')
    .find((candidate) => within(candidate).queryByRole('columnheader', { name: 'QTE_BK' }));
  expect(table).toBeDefined();
  return table;
}

function cellTexts(row) {
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent.replace(/\s/g, ''));
}

function detailsRow(type) {
  return within(detailsTable()).getByRole('row', { name: new RegExp(type) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStats(statsFixture());
  useContainers.mockReturnValue({
    data: { containers: CONTAINERS, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
    isLoading: false,
    isError: false,
  });
  useMarkContainerProcessed.mockReturnValue({ mutate: markProcessedMutate, isPending: false });
});

describe('BookingDetail — rendu', () => {
  it('charge les stats et les conteneurs du booking de l\'URL', () => {
    renderPage();

    expect(useBookingStats).toHaveBeenCalledWith('103');
    expect(useContainers).toHaveBeenCalledWith(expect.objectContaining({ booking_id: '103' }));
  });

  it('affiche les 3 StatCard QTE_BK, QTE_ENL et SOLDE avec les totaux', () => {
    renderPage();

    expect(screen.getByRole('group', { name: 'QTE_BK' })).toHaveTextContent('23');
    expect(screen.getByRole('group', { name: 'QTE_ENL' })).toHaveTextContent('12');
    expect(screen.getByRole('group', { name: 'SOLDE' })).toHaveTextContent('11');
  });

  it('affiche une table détails avec une ligne par type (3 lignes)', () => {
    renderPage();

    const dataRows = within(detailsTable()).getAllByRole('row').slice(1);
    expect(dataRows).toHaveLength(3);
    expect(dataRows.map((row) => cellTexts(row)[0])).toEqual(['40FT', '20FT', '10FT']);
  });

  it('n\'affiche aucune alerte quand aucune ne s\'applique', () => {
    renderPage();

    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('affiche l\'alerte de retard si is_late', () => {
    mockStats(statsFixture({ is_late: true }));
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent(/en retard/i);
  });

  it('affiche l\'alerte presque terminé si is_almost_done', () => {
    mockStats(statsFixture({ is_almost_done: true }));
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent(/presque terminé/i);
  });

  it('affiche l\'alerte booking vide si is_empty', () => {
    mockStats(statsFixture({ is_empty: true }));
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent(/aucun conteneur/i);
  });

  it('affiche plusieurs alertes simultanément', () => {
    mockStats(statsFixture({ is_late: true, is_almost_done: true }));
    renderPage();

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts.map((alert) => alert.textContent).join(' ')).toMatch(/en retard/i);
    expect(alerts.map((alert) => alert.textContent).join(' ')).toMatch(/presque terminé/i);
  });
});

describe('BookingDetail — calculs affichés', () => {
  it('affiche le % de chaque type et le % global', () => {
    renderPage();

    expect(cellTexts(detailsRow('40FT'))).toContain('70%');
    expect(cellTexts(detailsRow('20FT'))).toContain('45%');
    expect(cellTexts(detailsRow('10FT'))).toContain('0%');
    expect(screen.getByText(/52\s?%/)).toBeInTheDocument();
  });

  it('affiche le SOLDE de chaque type dans la colonne SOLDE', () => {
    renderPage();

    // Colonnes : Type, QTE_BK, QTE_ENL, SOLDE, %
    expect(cellTexts(detailsRow('40FT'))).toEqual(['40FT', '10', '7', '3', '70%']);
    expect(cellTexts(detailsRow('20FT'))).toEqual(['20FT', '11', '5', '6', '45%']);
    expect(cellTexts(detailsRow('10FT'))).toEqual(['10FT', '2', '0', '2', '0%']);
  });
});

describe('BookingDetail — interactions', () => {
  it('« Marquer traité » appelle la mutation useMarkContainerProcessed pour ce conteneur', async () => {
    const user = userEvent.setup();
    renderPage();

    const row = screen.getByRole('row', { name: /MSCU0000001/ });
    await user.click(within(row).getByRole('button', { name: /marquer traité/i }));

    expect(useMarkContainerProcessed).toHaveBeenCalled();
    expect(markProcessedMutate).toHaveBeenCalledTimes(1);
    expect(markProcessedMutate.mock.calls[0][0]).toMatchObject({ id: 501 });
  });

  it('ne propose pas « Marquer traité » pour un conteneur déjà traité', () => {
    renderPage();

    const row = screen.getByRole('row', { name: /MSCU0000002/ });
    expect(within(row).queryByRole('button', { name: /marquer traité/i })).not.toBeInTheDocument();
  });

  it('« Ajouter un conteneur » redirige vers le formulaire avec le booking présélectionné', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Ajouter un conteneur'));

    expect(screen.getByTestId('location')).toHaveTextContent('/containers/new?booking_id=103');
  });
});

describe('BookingDetail — cas d\'erreur', () => {
  it('affiche le message d\'erreur du backend si le booking est inexistant', () => {
    const error = Object.assign(new Error('Réservation introuvable.'), { status: 404 });
    useBookingStats.mockReturnValue({ data: undefined, isLoading: false, isError: true, error });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Réservation introuvable.');
    expect(screen.queryByRole('group', { name: 'QTE_BK' })).not.toBeInTheDocument();
  });
});
