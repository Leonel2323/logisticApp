const db = require('../config/db');

const TABLE = 'vehicles';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [vehicle] = await db(TABLE).insert(data).returning('*');
  return vehicle;
}

async function update(id, data) {
  const [vehicle] = await db(TABLE).where({ id }).update(data).returning('*');
  return vehicle;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
