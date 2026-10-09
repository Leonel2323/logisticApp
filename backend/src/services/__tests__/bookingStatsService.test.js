const { buildBookingStats } = require('../bookingStatsService');

function row(overrides) {
  return {
    id: 1,
    booking_number: 'BK9900001',
    shipping_company: 'MAERSK',
    client_id: 5,
    client_name: 'CLIENT ALPHA',
    start_date: '2026-04-01',
    end_date: '2026-04-15',
    status: 'en_cours',
    is_past_end_date: false,
    type: '40FT',
    qte_bk: 0,
    qte_enl: 0,
    ...overrides,
  };
}

describe('buildBookingStats', () => {
  it('returns null when there are no rows (booking not found)', () => {
    expect(buildBookingStats([])).toBeNull();
  });

  it('builds booking, details, totals and alerts from aggregated rows', () => {
    const stats = buildBookingStats([
      row({ type: '40FT', qte_bk: 10, qte_enl: 7 }),
      row({ type: '20FT', qte_bk: 11, qte_enl: 5 }),
      row({ type: '10FT', qte_bk: 2, qte_enl: 0 }),
    ]);

    expect(stats).toEqual({
      booking: {
        id: 1,
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
      alerts: { is_late: false, is_almost_done: false, is_empty: false },
    });
  });

  it('handles a booking without any container (all zeros, pct 0, is_empty)', () => {
    const stats = buildBookingStats([row({ type: '40FT' }), row({ type: '20FT' }), row({ type: '10FT' })]);

    expect(stats.details).toEqual([
      { type: '40FT', qte_bk: 0, qte_enl: 0, solde: 0, pct: 0 },
      { type: '20FT', qte_bk: 0, qte_enl: 0, solde: 0, pct: 0 },
      { type: '10FT', qte_bk: 0, qte_enl: 0, solde: 0, pct: 0 },
    ]);
    expect(stats.total).toEqual({ qte_bk: 0, qte_enl: 0, solde: 0, pct: 0 });
    expect(stats.alerts).toEqual({ is_late: false, is_almost_done: false, is_empty: true });
  });

  it('returns client null when the booking has no client', () => {
    const stats = buildBookingStats([row({ client_id: null, client_name: null })]);
    expect(stats.booking.client).toBeNull();
  });

  it('flags is_late when the end date is past and containers remain', () => {
    const stats = buildBookingStats([row({ is_past_end_date: true, qte_bk: 4, qte_enl: 1 })]);
    expect(stats.alerts.is_late).toBe(true);
  });

  it('does not flag is_late when everything has been processed, even past the end date', () => {
    const stats = buildBookingStats([row({ is_past_end_date: true, qte_bk: 4, qte_enl: 4 })]);
    expect(stats.alerts.is_late).toBe(false);
  });

  it('does not flag is_late when end_date is null', () => {
    const stats = buildBookingStats([row({ end_date: null, is_past_end_date: null, qte_bk: 4, qte_enl: 1 })]);
    expect(stats.alerts.is_late).toBe(false);
  });

  it('flags is_almost_done at pct >= 80 with a remaining balance', () => {
    const stats = buildBookingStats([row({ qte_bk: 10, qte_enl: 8 })]);
    expect(stats.total.pct).toBe(80);
    expect(stats.alerts.is_almost_done).toBe(true);
  });

  it('does not flag is_almost_done when the balance is zero (100%)', () => {
    const stats = buildBookingStats([row({ qte_bk: 10, qte_enl: 10 })]);
    expect(stats.alerts.is_almost_done).toBe(false);
  });

  it('rounds pct to the nearest integer', () => {
    const stats = buildBookingStats([row({ qte_bk: 3, qte_enl: 2 })]);
    expect(stats.details[0].pct).toBe(67);
  });
});
