const db = require('../config/db');

const TABLE = 'containers';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [container] = await db(TABLE).insert(data).returning('*');
  return container;
}

async function update(id, data) {
  const [container] = await db(TABLE).where({ id }).update(data).returning('*');
  return container;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
