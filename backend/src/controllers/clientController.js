const clientModel = require('../models/clientModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const clients = await clientModel.findAll();
    return success(res, clients);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const client = await clientModel.findById(req.params.id);
    if (!client) return failure(res, 'Client not found', 404);
    return success(res, client);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const client = await clientModel.create(req.body);
    return success(res, client, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const client = await clientModel.update(req.params.id, req.body);
    if (!client) return failure(res, 'Client not found', 404);
    return success(res, client);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await clientModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
