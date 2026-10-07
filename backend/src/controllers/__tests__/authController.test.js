jest.mock('../../models/userModel', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../services/authService', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
}));

const userModel = require('../../models/userModel');
const { hashPassword, comparePassword, generateToken } = require('../../services/authService');
const { register, login, me, logout } = require('../authController');

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

describe('register', () => {
  it('creates a user and returns it without password_hash', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashed');
    userModel.create.mockResolvedValue({
      id: 1,
      full_name: 'Test',
      email: 'a@b.com',
      role: 'operator',
      password_hash: 'hashed',
    });

    const req = { body: { full_name: 'Test', email: 'a@b.com', password: 'password123' } };
    const res = mockRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(userModel.create).toHaveBeenCalledWith({
      full_name: 'Test',
      email: 'a@b.com',
      password_hash: 'hashed',
      role: 'operator',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).not.toHaveProperty('password_hash');
  });

  it('rejects when the email is already in use', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1 });

    const req = { body: { full_name: 'Test', email: 'a@b.com', password: 'password123' } };
    const res = mockRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Cet email est déjà utilisé.' }));
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('forwards unexpected errors to next', async () => {
    userModel.findByEmail.mockRejectedValue(new Error('db down'));

    const req = { body: { full_name: 'Test', email: 'a@b.com', password: 'password123' } };
    const res = mockRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('login', () => {
  const user = { id: 1, email: 'a@b.com', role: 'operator', password_hash: 'hashed' };

  it('returns a token and the user without password_hash on valid credentials', async () => {
    userModel.findByEmail.mockResolvedValue(user);
    comparePassword.mockResolvedValue(true);
    generateToken.mockReturnValue('jwt.token.value');

    const req = { body: { email: 'a@b.com', password: 'password123' } };
    const res = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data.token).toBe('jwt.token.value');
    expect(payload.data.user).not.toHaveProperty('password_hash');
    expect(payload.data.user.id).toBe(1);
  });

  it('rejects with a generic message when the user does not exist', async () => {
    userModel.findByEmail.mockResolvedValue(null);

    const req = { body: { email: 'nope@b.com', password: 'password123' } };
    const res = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Email ou mot de passe incorrect.' }));
  });

  it('rejects with the same generic message when the password is incorrect', async () => {
    userModel.findByEmail.mockResolvedValue(user);
    comparePassword.mockResolvedValue(false);

    const req = { body: { email: 'a@b.com', password: 'wrong' } };
    const res = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Email ou mot de passe incorrect.' }));
  });
});

describe('me', () => {
  it('returns the authenticated user', async () => {
    userModel.findById.mockResolvedValue({ id: 1, email: 'a@b.com', role: 'operator' });

    const req = { user: { id: 1 } };
    const res = mockRes();
    const next = jest.fn();

    await me(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { id: 1, email: 'a@b.com', role: 'operator' } }),
    );
  });

  it('returns 404 when the user no longer exists', async () => {
    userModel.findById.mockResolvedValue(null);

    const req = { user: { id: 999 } };
    const res = mockRes();
    const next = jest.fn();

    await me(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Utilisateur introuvable.' }));
  });
});

describe('logout', () => {
  it('returns a confirmation message', async () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    await logout(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { message: 'Déconnexion réussie.' } }));
  });
});
