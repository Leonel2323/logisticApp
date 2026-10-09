jest.mock('../../config/db', () => {
  const db = jest.fn();
  db.transaction = jest.fn();
  return db;
});

const db = require('../../config/db');
const containerModel = require('../containerModel');
const { markProcessed: markProcessedSchema } = require('../../validations/containerValidation');

// Simule db(table).where().first() puis la transaction update + insert.
function mockMarkAsProcessed(container) {
  db.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(container),
  });

  const update = jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ ...container, is_processed: true }]) });
  const insert = jest.fn().mockResolvedValue([1]);
  const trx = jest.fn((table) =>
    table === 'container_movements' ? { insert } : { where: jest.fn().mockReturnValue({ update }) }
  );
  trx.fn = { now: jest.fn(() => 'NOW()') };
  db.transaction.mockImplementation((callback) => callback(trx));

  return { update, insert };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('markAsProcessed', () => {
  it('uses the current time by default', async () => {
    const { update, insert } = mockMarkAsProcessed({ id: 5, is_processed: false });

    await containerModel.markAsProcessed(5, { vehicle_id: 7 });

    expect(update).toHaveBeenCalledWith({ is_processed: true, departure_datetime: 'NOW()' });
    expect(insert).toHaveBeenCalledWith({
      container_id: 5,
      movement_type: 'IN',
      movement_datetime: 'NOW()',
      vehicle_id: 7,
      driver_id: null,
    });
  });

  it('uses processed_at when provided (historical import)', async () => {
    const { update, insert } = mockMarkAsProcessed({ id: 5, is_processed: false });

    await containerModel.markAsProcessed(5, { processed_at: '2026-04-01T08:30:00+01:00' });

    expect(update).toHaveBeenCalledWith({ is_processed: true, departure_datetime: '2026-04-01T08:30:00+01:00' });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ movement_datetime: '2026-04-01T08:30:00+01:00' })
    );
  });

  it('returns null when the container does not exist', async () => {
    mockMarkAsProcessed(undefined);

    await expect(containerModel.markAsProcessed(99)).resolves.toBeNull();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('refuses a container already processed', async () => {
    mockMarkAsProcessed({ id: 5, is_processed: true });

    await expect(containerModel.markAsProcessed(5)).rejects.toMatchObject({ status: 409 });
  });
});

describe('mark-processed API schema', () => {
  it('strips processed_at so the API cannot backdate a movement', () => {
    const { value } = markProcessedSchema.validate(
      { vehicle_id: 7, processed_at: '2020-01-01T00:00:00Z' },
      { stripUnknown: true }
    );

    expect(value).toEqual({ vehicle_id: 7 });
  });
});

describe('findByContainerNumbers', () => {
  it('fetches all the given container numbers in one query', async () => {
    const rows = [{ id: 1, container_number: 'TCNU00035' }];
    const query = { whereIn: jest.fn().mockReturnThis(), select: jest.fn().mockResolvedValue(rows) };
    db.mockReturnValue(query);

    const result = await containerModel.findByContainerNumbers(['TCNU00035', 'TCNU00036']);

    expect(db).toHaveBeenCalledWith('containers');
    expect(query.whereIn).toHaveBeenCalledWith('container_number', ['TCNU00035', 'TCNU00036']);
    expect(result).toEqual(rows);
  });

  it('does not query the database for an empty list', async () => {
    await expect(containerModel.findByContainerNumbers([])).resolves.toEqual([]);
    expect(db).not.toHaveBeenCalled();
  });
});
