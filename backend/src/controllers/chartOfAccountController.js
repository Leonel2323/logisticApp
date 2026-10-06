const chartOfAccountModel = require('../models/chartOfAccountModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const accounts = await chartOfAccountModel.findAll();
    return success(res, accounts);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const account = await chartOfAccountModel.findById(req.params.id);
    if (!account) return failure(res, 'Account not found', 404);
    return success(res, account);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const account = await chartOfAccountModel.create(req.body);
    return success(res, account, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const account = await chartOfAccountModel.update(req.params.id, req.body);
    if (!account) return failure(res, 'Account not found', 404);
    return success(res, account);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await chartOfAccountModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
