jest.mock('../../config/db', () => jest.fn());

const db = require('../../config/db');
const bookingModel = require('../bookingModel');

function mockQuery(result) {
  const query = {
    where: jest.fn().mockReturnThis(),
    whereNot: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(result),
  };
  db.mockReturnValue(query);
  return query;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('findByBookingNumber', () => {
  it('returns the booking matching the booking number', async () => {
    const booking = { id: 103, booking_number: 'ZU1400003', shipping_company: 'YANG MING' };
    const query = mockQuery(booking);

    const result = await bookingModel.findByBookingNumber('ZU1400003');

    expect(db).toHaveBeenCalledWith('bookings');
    expect(query.where).toHaveBeenCalledWith({ booking_number: 'ZU1400003' });
    expect(query.whereNot).not.toHaveBeenCalled();
    expect(query.first).toHaveBeenCalled();
    expect(result).toEqual(booking);
  });

  it('excludes the given id when provided', async () => {
    const query = mockQuery(undefined);

    await bookingModel.findByBookingNumber('ZU1400003', 103);

    expect(query.whereNot).toHaveBeenCalledWith({ id: 103 });
  });

  it('returns undefined when no booking has this number', async () => {
    mockQuery(undefined);

    const result = await bookingModel.findByBookingNumber('INCONNU');

    expect(result).toBeUndefined();
  });
});

describe('findByBookingNumbers', () => {
  it('fetches all the given booking numbers in one query, deleted ones included', async () => {
    const rows = [{ id: 7, booking_number: 'BK9900001', deleted_at: null }];
    const query = { whereIn: jest.fn().mockReturnThis(), whereNull: jest.fn(), select: jest.fn().mockResolvedValue(rows) };
    db.mockReturnValue(query);

    const result = await bookingModel.findByBookingNumbers(['BK9900001']);

    expect(query.whereIn).toHaveBeenCalledWith('booking_number', ['BK9900001']);
    expect(query.whereNull).not.toHaveBeenCalled();
    expect(result).toEqual(rows);
  });

  it('does not query the database for an empty list', async () => {
    await expect(bookingModel.findByBookingNumbers([])).resolves.toEqual([]);
    expect(db).not.toHaveBeenCalled();
  });
});
