import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContainerNew from '../ContainerNew';

const { useBookings, useBooking, useClients, useCreateContainer, createMutate } = vi.hoisted(() => ({
  useBookings: vi.fn(),
  useBooking: vi.fn(),
  useClients: vi.fn(),
  useCreateContainer: vi.fn(),
  createMutate: vi.fn(),
}));

vi.mock('../../hooks/useBookings', () => ({ useBookings, useBooking }));
vi.mock('../../hooks/useClients', () => ({ useClients }));
vi.mock('../../hooks/useContainers', () => ({ useCreateContainer }));

const BOOKING_103 = { id: 103, booking_number: 'ZU1400003', shipping_company: 'YANG MING', client_id: 62 };
const BOOKING_104 = { id: 104, booking_number: 'ZU1400004', shipping_company: 'MAERSK', client_id: 62 };
const BOOKING_103_LABEL = 'ZU1400003 — YANG MING — WOURI LOGISTICS 11';

const notFound = Object.assign(new Error('Réservation introuvable.'), { status: 404 });

// GET /bookings/:id simulé : 103 existe, tout autre id renvoie 404.
function bookingById(id) {
  if (!id) return { data: undefined, isError: false, error: null };
  if (String(id) === '103') return { data: BOOKING_103, isError: false, error: null };
  return { data: undefined, isError: true, error: notFound };
}

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/containers/new${search}`]}>
      <Routes>
        <Route path="/containers/new" element={<ContainerNew />} />
        <Route path="/containers" element={<p>Liste des conteneurs</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function bookingField() {
  return screen.getByRole('combobox', { name: 'Booking' });
}

beforeEach(() => {
  vi.clearAllMocks();
  useBookings.mockReturnValue({
    data: { bookings: [BOOKING_103, BOOKING_104], pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
    isLoading: false,
  });
  useBooking.mockImplementation(bookingById);
  useClients.mockReturnValue({ data: [{ id: 62, name: 'WOURI LOGISTICS 11', code: 'CLI0062' }], isLoading: false });
  useCreateContainer.mockReturnValue({ mutate: createMutate, isPending: false });
});

describe('ContainerNew — paramètre ?booking_id', () => {
  it('présélectionne le booking avec ?booking_id=103', async () => {
    renderPage('?booking_id=103');

    await waitFor(() => expect(bookingField()).toHaveValue(BOOKING_103_LABEL));
    expect(useBooking).toHaveBeenCalledWith('103');
    expect(screen.queryByText('Booking introuvable')).not.toBeInTheDocument();
  });

  it('affiche le booking présélectionné même s\'il n\'est pas dans les 100 chargés', async () => {
    useBookings.mockReturnValue({
      data: { bookings: [BOOKING_104], pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } },
      isLoading: false,
    });

    renderPage('?booking_id=103');

    await waitFor(() => expect(bookingField()).toHaveValue(BOOKING_103_LABEL));
  });

  it('laisse le champ vide sans paramètre', () => {
    renderPage();

    expect(bookingField()).toHaveValue('');
    expect(screen.queryByText('Booking introuvable')).not.toBeInTheDocument();
    expect(useBooking).not.toHaveBeenCalledWith(expect.anything());
  });

  it('affiche « Booking introuvable » et laisse le champ vide avec ?booking_id=9999', () => {
    renderPage('?booking_id=9999');

    expect(screen.getByText('Booking introuvable')).toBeInTheDocument();
    expect(bookingField()).toHaveValue('');
    expect(bookingField()).toHaveAccessibleDescription('Booking introuvable');
  });

  it('traite un id mal formé comme introuvable sans appeler l\'API', () => {
    renderPage('?booking_id=abc');

    expect(screen.getByText('Booking introuvable')).toBeInTheDocument();
    expect(useBooking).not.toHaveBeenCalledWith('abc');
  });

  it('envoie le booking présélectionné à la création', async () => {
    const user = userEvent.setup();
    renderPage('?booking_id=103');
    await waitFor(() => expect(bookingField()).toHaveValue(BOOKING_103_LABEL));

    await user.type(screen.getByLabelText(/numéro de conteneur/i), 'MSCU1234567');
    await user.selectOptions(screen.getByLabelText(/^type/i), '40FT');
    await user.selectOptions(screen.getByLabelText(/^état/i), 'PLEIN');
    await user.click(screen.getByRole('button', { name: 'Créer le conteneur' }));

    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      container_number: 'MSCU1234567',
      type: '40FT',
      state: 'PLEIN',
      booking_id: 103,
    });
  });
});
