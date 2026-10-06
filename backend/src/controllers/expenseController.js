const expenseModel = require('../models/expenseModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const expenses = await expenseModel.findAll();
    return success(res, expenses);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const expense = await expenseModel.findById(req.params.id);
    if (!expense) return failure(res, 'Expense not found', 404);
    return success(res, expense);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const expense = await expenseModel.create(req.body);
    return success(res, expense, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const expense = await expenseModel.update(req.params.id, req.body);
    if (!expense) return failure(res, 'Expense not found', 404);
    return success(res, expense);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await expenseModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
