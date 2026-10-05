const bookingModel = require('../models/bookingModel');
const { success, failure } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const bookings = await bookingModel.findAll();
    return success(res, bookings);
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const booking = await bookingModel.findById(req.params.id);
    if (!booking) return failure(res, 'Booking not found', 404);
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
    if (!booking) return failure(res, 'Booking not found', 404);
    return success(res, booking);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await bookingModel.remove(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
