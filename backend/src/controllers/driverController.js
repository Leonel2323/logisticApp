const driverModel = require('../models/driverModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const drivers = await driverModel.findAll();
    return success(res, drivers);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const driver = await driverModel.findById(req.params.id);
    if (!driver) return failure(res, 'Driver not found', 404);
    return success(res, driver);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const driver = await driverModel.create(req.body);
    return success(res, driver, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const driver = await driverModel.update(req.params.id, req.body);
    if (!driver) return failure(res, 'Driver not found', 404);
    return success(res, driver);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await driverModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
