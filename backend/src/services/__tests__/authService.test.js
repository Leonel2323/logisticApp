const { hashPassword, comparePassword, generateToken, verifyToken } = require('../authService');

describe('authService', () => {
  describe('hashPassword / comparePassword', () => {
    it('hashes a password and verifies it against the hash', async () => {
      const hash = await hashPassword('password123');
      expect(hash).not.toBe('password123');
      await expect(comparePassword('password123', hash)).resolves.toBe(true);
    });

    it('rejects an incorrect password against the hash', async () => {
      const hash = await hashPassword('password123');
      await expect(comparePassword('wrongpassword', hash)).resolves.toBe(false);
    });
  });

  describe('generateToken / verifyToken', () => {
    const user = { id: 1, email: 'test@example.com', role: 'operator' };

    it('generates a token that encodes id, email and role', () => {
      const token = generateToken(user);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('sets an expiration of exactly 7 days', () => {
      const token = generateToken(user);
      const decoded = verifyToken(token);
      expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
    });

    it('throws when verifying an invalid token', () => {
      expect(() => verifyToken('not.a.valid.token')).toThrow();
    });
  });
});
