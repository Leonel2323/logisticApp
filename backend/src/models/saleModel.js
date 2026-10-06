const db = require('../config/db');

const TABLE = 'sales';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [sale] = await db(TABLE).insert(data).returning('*');
  return sale;
}

async function update(id, data) {
  const [sale] = await db(TABLE).where({ id }).update(data).returning('*');
  return sale;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
