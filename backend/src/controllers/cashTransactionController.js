const cashTransactionModel = require('../models/cashTransactionModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const transactions = await cashTransactionModel.findAll();
    return success(res, transactions);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const transaction = await cashTransactionModel.findById(req.params.id);
    if (!transaction) return failure(res, 'Transaction not found', 404);
    return success(res, transaction);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const transaction = await cashTransactionModel.create(req.body);
    return success(res, transaction, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const transaction = await cashTransactionModel.update(req.params.id, req.body);
    if (!transaction) return failure(res, 'Transaction not found', 404);
    return success(res, transaction);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await cashTransactionModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
