jest.mock('../../services/authService');

const { verifyToken } = require('../../services/authService');
const { authenticate, authorize } = require('../authMiddleware');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
}

describe('authenticate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when the Authorization header is missing', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'En-tête Authorization manquant ou invalide.' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when the Authorization header is malformed', async () => {
    const req = { headers: { authorization: 'Token abc' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired token', async () => {
    verifyToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });
    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token invalide ou expiré.' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the decoded payload to req.user and calls next on a valid token', async () => {
    verifyToken.mockReturnValue({ id: 1, email: 'a@b.com', role: 'admin' });
    const req = { headers: { authorization: 'Bearer goodtoken' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(req.user).toEqual({ id: 1, email: 'a@b.com', role: 'admin' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authorize', () => {
  it('calls next when req.user.role is in the allowed list', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin', 'supervisor')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects with 403 when req.user.role is not in the allowed list', () => {
    const req = { user: { role: 'operator' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 403 when req.user is missing', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
