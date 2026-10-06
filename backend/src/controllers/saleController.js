const saleModel = require('../models/saleModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const sales = await saleModel.findAll();
    return success(res, sales);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const sale = await saleModel.findById(req.params.id);
    if (!sale) return failure(res, 'Sale not found', 404);
    return success(res, sale);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const sale = await saleModel.create(req.body);
    return success(res, sale, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const sale = await saleModel.update(req.params.id, req.body);
    if (!sale) return failure(res, 'Sale not found', 404);
    return success(res, sale);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await saleModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
