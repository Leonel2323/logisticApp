const containerModel = require('../models/containerModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const { data, pagination } = await containerModel.findAll(req.query);
    return success(res, { containers: data, pagination });
  } catch (err) {
    return next(err);
  }
}

async function detail(req, res, next) {
  try {
    const container = await containerModel.findById(req.params.id);
    if (!container) return failure(res, 'Conteneur introuvable.', 404);
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
    if (!container) return failure(res, 'Conteneur introuvable.', 404);
    return success(res, container);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const container = await containerModel.remove(req.params.id);
    if (!container) return failure(res, 'Conteneur introuvable.', 404);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

async function markProcessed(req, res, next) {
  try {
    const container = await containerModel.markAsProcessed(req.params.id, req.body);
    if (!container) return failure(res, 'Conteneur introuvable.', 404);
    return success(res, container);
  } catch (err) {
    return next(err);
  }
}

async function movements(req, res, next) {
  try {
    const rows = await containerModel.getMovements(req.params.id);
    if (!rows) return failure(res, 'Conteneur introuvable.', 404);
    return success(res, rows);
  } catch (err) {
    return next(err);
  }
}

async function statsByBooking(req, res, next) {
  try {
    const stats = await containerModel.getStatsByBooking(req.params.id);
    if (!stats) return failure(res, 'Réservation introuvable.', 404);
    return success(res, stats);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, detail, create, update, remove, markProcessed, movements, statsByBooking };
