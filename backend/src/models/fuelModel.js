const db = require('../config/db');

const TABLE = 'fuel_transactions';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [transaction] = await db(TABLE).insert(data).returning('*');
  return transaction;
}

async function update(id, data) {
  const [transaction] = await db(TABLE).where({ id }).update(data).returning('*');
  return transaction;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
