const db = require('../config/db');

const TABLE = 'drivers';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [driver] = await db(TABLE).insert(data).returning('*');
  return driver;
}

async function update(id, data) {
  const [driver] = await db(TABLE).where({ id }).update(data).returning('*');
  return driver;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
