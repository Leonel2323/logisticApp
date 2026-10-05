const vehicleModel = require('../models/vehicleModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const vehicles = await vehicleModel.findAll();
    return success(res, vehicles);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const vehicle = await vehicleModel.findById(req.params.id);
    if (!vehicle) return failure(res, 'Vehicle not found', 404);
    return success(res, vehicle);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const vehicle = await vehicleModel.create(req.body);
    return success(res, vehicle, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const vehicle = await vehicleModel.update(req.params.id, req.body);
    if (!vehicle) return failure(res, 'Vehicle not found', 404);
    return success(res, vehicle);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await vehicleModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
