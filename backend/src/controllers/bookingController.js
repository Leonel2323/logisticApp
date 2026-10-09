const bookingModel = require('../models/bookingModel');
const { buildBookingStats } = require('../services/bookingStatsService');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const { data, pagination } = await bookingModel.findAll(req.query);
    return success(res, { bookings: data, pagination });
  } catch (err) {
    return next(err);
  }
}

async function detail(req, res, next) {
  try {
    const booking = await bookingModel.findById(req.params.id);
    if (!booking) return failure(res, 'Réservation introuvable.', 404);
    return success(res, booking);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const booking = await bookingModel.create(req.body);
    return success(res, booking, 201);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const booking = await bookingModel.update(req.params.id, req.body);
    if (!booking) return failure(res, 'Réservation introuvable.', 404);
    return success(res, booking);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const booking = await bookingModel.remove(req.params.id);
    if (!booking) return failure(res, 'Réservation introuvable.', 404);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

async function stats(req, res, next) {
  try {
    const rows = await bookingModel.getStats(req.params.id);
    const bookingStats = buildBookingStats(rows);
    if (!bookingStats) return failure(res, 'Réservation introuvable.', 404);
    return success(res, bookingStats);
  } catch (err) {
    return next(err);
  }
}

async function shippingCompanies(req, res, next) {
  try {
    const companies = await bookingModel.listShippingCompanies();
    return success(res, companies);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, detail, create, update, remove, stats, shippingCompanies };
