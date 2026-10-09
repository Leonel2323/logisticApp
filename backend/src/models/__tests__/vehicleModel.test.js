jest.mock('../../config/db', () => jest.fn());

const db = require('../../config/db');
const vehicleModel = require('../vehicleModel');

function mockQuery(result) {
  const query = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(result),
  };
  db.mockReturnValue(query);
  return query;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('findByPlateNumber', () => {
  it('returns the vehicle matching the plate number', async () => {
    const vehicle = { id: 7, plate_number: 'LT1234AB', type: 'TRACTEUR' };
    const query = mockQuery(vehicle);

    const result = await vehicleModel.findByPlateNumber('LT1234AB');

    expect(db).toHaveBeenCalledWith('vehicles');
    expect(query.where).toHaveBeenCalledWith({ plate_number: 'LT1234AB' });
    expect(query.first).toHaveBeenCalled();
    expect(result).toEqual(vehicle);
  });

  it('returns undefined when no vehicle has this plate number', async () => {
    mockQuery(undefined);

    const result = await vehicleModel.findByPlateNumber('XX0000XX');

    expect(result).toBeUndefined();
  });
});

describe('findByPlateNumbers', () => {
  it('fetches all the given plate numbers in one query', async () => {
    const rows = [{ id: 3, plate_number: 'TRTEST0018', type: 'TRACTEUR' }];
    const query = { whereIn: jest.fn().mockReturnThis(), select: jest.fn().mockResolvedValue(rows) };
    db.mockReturnValue(query);

    const result = await vehicleModel.findByPlateNumbers(['TRTEST0018']);

    expect(db).toHaveBeenCalledWith('vehicles');
    expect(query.whereIn).toHaveBeenCalledWith('plate_number', ['TRTEST0018']);
    expect(result).toEqual(rows);
  });

  it('does not query the database for an empty list', async () => {
    await expect(vehicleModel.findByPlateNumbers([])).resolves.toEqual([]);
    expect(db).not.toHaveBeenCalled();
  });
});
