jest.mock('../../models/containerModel', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  markAsProcessed: jest.fn(),
  getMovements: jest.fn(),
  getStatsByBooking: jest.fn(),
}));

const containerModel = require('../../models/containerModel');
const {
  list,
  detail,
  create,
  update,
  remove,
  markProcessed,
  movements,
  statsByBooking,
} = require('../containerController');

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

describe('list', () => {
  it('returns containers with pagination', async () => {
    containerModel.findAll.mockResolvedValue({
      data: [{ id: 1, container_number: 'MSCU00001' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const req = { query: { type: '40FT' } };
    const res = mockRes();
    const next = jest.fn();

    await list(req, res, next);

    expect(containerModel.findAll).toHaveBeenCalledWith(req.query);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.containers).toHaveLength(1);
    expect(payload.data.pagination.total).toBe(1);
  });

  it('forwards unexpected errors to next', async () => {
    containerModel.findAll.mockRejectedValue(new Error('db down'));
    const req = { query: {} };
    const res = mockRes();
    const next = jest.fn();

    await list(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('detail', () => {
  it('returns the container with booking, client and movements', async () => {
    const container = { id: 1, container_number: 'MSCU00001', booking: {}, client: {}, movements: [] };
    containerModel.findById.mockResolvedValue(container);

    const req = { params: { id: '1' } };
    const res = mockRes();
    const next = jest.fn();

    await detail(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: container }));
  });

  it('returns 404 when the container does not exist', async () => {
    containerModel.findById.mockResolvedValue(null);

    const req = { params: { id: '999' } };
    const res = mockRes();
    const next = jest.fn();

    await detail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Conteneur introuvable.' }));
  });
});

describe('create', () => {
  it('creates a container and returns it with 201', async () => {
    const container = { id: 1, container_number: 'MSCU00001' };
    containerModel.create.mockResolvedValue(container);

    const req = { body: { container_number: 'MSCU00001', booking_id: 5 } };
    const res = mockRes();
    const next = jest.fn();

    await create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: container }));
  });

  it('forwards a conflict error (duplicate container_number) to next', async () => {
    const err = new Error('Le numéro de conteneur "MSCU00001" est déjà utilisé.');
    err.status = 409;
    containerModel.create.mockRejectedValue(err);

    const req = { body: { container_number: 'MSCU00001', booking_id: 5 } };
    const res = mockRes();
    const next = jest.fn();

    await create(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it('forwards a not-found error (unknown booking_id) to next', async () => {
    const err = new Error("Le booking #999 n'existe pas.");
    err.status = 404;
    containerModel.create.mockRejectedValue(err);

    const req = { body: { container_number: 'MSCU00002', booking_id: 999 } };
    const res = mockRes();
    const next = jest.fn();

    await create(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('update', () => {
  it('updates a container and returns it', async () => {
    const container = { id: 1, state: 'VIDE' };
    containerModel.update.mockResolvedValue(container);

    const req = { params: { id: '1' }, body: { state: 'VIDE' } };
    const res = mockRes();
    const next = jest.fn();

    await update(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: container }));
  });

  it('returns 404 when the container does not exist', async () => {
    containerModel.update.mockResolvedValue(null);

    const req = { params: { id: '999' }, body: { state: 'VIDE' } };
    const res = mockRes();
    const next = jest.fn();

    await update(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('remove', () => {
  it('deletes a container and returns 204', async () => {
    containerModel.remove.mockResolvedValue({ id: 1 });

    const req = { params: { id: '1' } };
    const res = mockRes();
    const next = jest.fn();

    await remove(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 404 when the container does not exist', async () => {
    containerModel.remove.mockResolvedValue(null);

    const req = { params: { id: '999' } };
    const res = mockRes();
    const next = jest.fn();

    await remove(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('forwards a conflict error (existing movements) to next', async () => {
    const err = new Error('Impossible de supprimer un conteneur ayant des mouvements associés.');
    err.status = 409;
    containerModel.remove.mockRejectedValue(err);

    const req = { params: { id: '1' } };
    const res = mockRes();
    const next = jest.fn();

    await remove(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('markProcessed', () => {
  it('marks the container as processed and returns it', async () => {
    const container = { id: 1, is_processed: true };
    containerModel.markAsProcessed.mockResolvedValue(container);

    const req = { params: { id: '1' }, body: {} };
    const res = mockRes();
    const next = jest.fn();

    await markProcessed(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: container }));
  });

  it('returns 404 when the container does not exist', async () => {
    containerModel.markAsProcessed.mockResolvedValue(null);

    const req = { params: { id: '999' }, body: {} };
    const res = mockRes();
    const next = jest.fn();

    await markProcessed(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('forwards a conflict error (already processed) to next', async () => {
    const err = new Error('Ce conteneur est déjà marqué comme traité.');
    err.status = 409;
    containerModel.markAsProcessed.mockRejectedValue(err);

    const req = { params: { id: '1' }, body: {} };
    const res = mockRes();
    const next = jest.fn();

    await markProcessed(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('movements', () => {
  it('returns the movement history of a container', async () => {
    const rows = [{ id: 1, movement_type: 'IN' }];
    containerModel.getMovements.mockResolvedValue(rows);

    const req = { params: { id: '1' } };
    const res = mockRes();
    const next = jest.fn();

    await movements(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: rows }));
  });

  it('returns 404 when the container does not exist', async () => {
    containerModel.getMovements.mockResolvedValue(null);

    const req = { params: { id: '999' } };
    const res = mockRes();
    const next = jest.fn();

    await movements(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('statsByBooking', () => {
  it('returns QTE_BK/QTE_ENL/SOLDE stats grouped by type', async () => {
    const stats = [{ type: '40FT', qte_bk: 3, qte_enl: 1, solde: 2 }];
    containerModel.getStatsByBooking.mockResolvedValue(stats);

    const req = { params: { id: '101' } };
    const res = mockRes();
    const next = jest.fn();

    await statsByBooking(req, res, next);

    expect(containerModel.getStatsByBooking).toHaveBeenCalledWith('101');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: stats }));
  });

  it('returns 404 when the booking does not exist', async () => {
    containerModel.getStatsByBooking.mockResolvedValue(null);

    const req = { params: { id: '999999' } };
    const res = mockRes();
    const next = jest.fn();

    await statsByBooking(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Réservation introuvable.' }));
  });

  it('forwards unexpected errors to next', async () => {
    containerModel.getStatsByBooking.mockRejectedValue(new Error('db down'));

    const req = { params: { id: '101' } };
    const res = mockRes();
    const next = jest.fn();

    await statsByBooking(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
