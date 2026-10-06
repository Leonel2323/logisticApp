const containerMovementModel = require('../models/containerMovementModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const movements = await containerMovementModel.findAll();
    return success(res, movements);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const movement = await containerMovementModel.findById(req.params.id);
    if (!movement) return failure(res, 'Movement not found', 404);
    return success(res, movement);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const movement = await containerMovementModel.create(req.body);
    return success(res, movement, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const movement = await containerMovementModel.update(req.params.id, req.body);
    if (!movement) return failure(res, 'Movement not found', 404);
    return success(res, movement);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await containerMovementModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
