const containerModel = require('../models/containerModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const containers = await containerModel.findAll();
    return success(res, containers);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const container = await containerModel.findById(req.params.id);
    if (!container) return failure(res, 'Container not found', 404);
    return success(res, container);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const container = await containerModel.create(req.body);
    return success(res, container, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const container = await containerModel.update(req.params.id, req.body);
    if (!container) return failure(res, 'Container not found', 404);
    return success(res, container);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await containerModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
