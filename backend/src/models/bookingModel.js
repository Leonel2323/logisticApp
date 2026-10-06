const db = require('../config/db');

const TABLE = 'bookings';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [booking] = await db(TABLE).insert(data).returning('*');
  return booking;
}

async function update(id, data) {
  const [booking] = await db(TABLE).where({ id }).update(data).returning('*');
  return booking;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
