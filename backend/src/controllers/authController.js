const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');
const { success, failure } = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return failure(res, 'Email already in use', 409);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ name, email, password_hash, role: 'operator' });

    return success(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 201);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return failure(res, 'Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return failure(res, 'Invalid credentials', 401);
    }

    if (!user.is_active) {
      return failure(res, 'Account is inactive. Contact an administrator.', 403);
    }

    const token = signToken({ id: user.id, role: user.role });
    return success(res, { token });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return failure(res, 'User not found', 404);
    }
    return success(res, user);
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me };
