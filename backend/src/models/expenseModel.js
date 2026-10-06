const db = require('../config/db');

const TABLE = 'expenses';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [expense] = await db(TABLE).insert(data).returning('*');
  return expense;
}

async function update(id, data) {
  const [expense] = await db(TABLE).where({ id }).update(data).returning('*');
  return expense;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
