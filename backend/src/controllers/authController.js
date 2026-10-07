const userModel = require('../models/userModel');
const { hashPassword, comparePassword, generateToken } = require('../services/authService');
const { success, failure } = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const { full_name, email, password } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return failure(res, 'Cet email est déjà utilisé.', 409);
    }

    const password_hash = await hashPassword(password);
    const user = await userModel.create({ full_name, email, password_hash, role: 'operator' });

    return success(res, { id: user.id, full_name: user.full_name, email: user.email, role: user.role }, 201);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return failure(res, 'Email ou mot de passe incorrect.', 401);
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return failure(res, 'Email ou mot de passe incorrect.', 401);
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return success(res, { token, user: safeUser });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return failure(res, 'Utilisateur introuvable.', 404);
    }
    return success(res, user);
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    return success(res, { message: 'Déconnexion réussie.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me, logout };
