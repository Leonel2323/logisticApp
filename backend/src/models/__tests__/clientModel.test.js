jest.mock('../../config/db', () => jest.fn());

const db = require('../../config/db');
const clientModel = require('../clientModel');

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

describe('findByName', () => {
  it('returns the client matching the exact name', async () => {
    const client = { id: 62, code: 'CLI0062', name: 'WOURI LOGISTICS 11' };
    const query = mockQuery(client);

    const result = await clientModel.findByName('WOURI LOGISTICS 11');

    expect(db).toHaveBeenCalledWith('clients');
    expect(query.where).toHaveBeenCalledWith({ name: 'WOURI LOGISTICS 11' });
    expect(query.first).toHaveBeenCalled();
    expect(result).toEqual(client);
  });

  it('returns undefined when no client has this name', async () => {
    mockQuery(undefined);

    const result = await clientModel.findByName('INCONNU');

    expect(result).toBeUndefined();
  });
});
