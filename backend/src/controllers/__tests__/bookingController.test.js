jest.mock('../../models/bookingModel', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStats: jest.fn(),
  listShippingCompanies: jest.fn(),
}));

const bookingModel = require('../../models/bookingModel');
const { stats } = require('../bookingController');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('stats', () => {
  it('returns the enriched stats built from the aggregated rows', async () => {
    bookingModel.getStats.mockResolvedValue([
      {
        id: 101,
        booking_number: 'BK9900001',
        shipping_company: 'MAERSK',
        client_id: 5,
        client_name: 'CLIENT ALPHA',
        start_date: '2026-04-01',
        end_date: '2026-04-15',
        status: 'en_cours',
        is_past_end_date: false,
        type: '40FT',
        qte_bk: 4,
        qte_enl: 1,
      },
    ]);

    const req = { params: { id: '101' } };
    const res = mockRes();
    const next = jest.fn();

    await stats(req, res, next);

    expect(bookingModel.getStats).toHaveBeenCalledWith('101');
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.booking).toEqual(expect.objectContaining({ id: 101, client: { id: 5, name: 'CLIENT ALPHA' } }));
    expect(body.data.details).toEqual([{ type: '40FT', qte_bk: 4, qte_enl: 1, solde: 3, pct: 25 }]);
    expect(body.data.total).toEqual({ qte_bk: 4, qte_enl: 1, solde: 3, pct: 25 });
    expect(body.data.alerts).toEqual({ is_late: false, is_almost_done: false, is_empty: false });
  });

  it('returns 404 with a French message when the booking does not exist', async () => {
    bookingModel.getStats.mockResolvedValue([]);

    const req = { params: { id: '999999' } };
    const res = mockRes();
    const next = jest.fn();

    await stats(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Réservation introuvable.' }));
  });

  it('forwards unexpected errors to next (never exposed raw)', async () => {
    bookingModel.getStats.mockRejectedValue(new Error('relation "containers" does not exist'));

    const req = { params: { id: '101' } };
    const res = mockRes();
    const next = jest.fn();

    await stats(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });
});
