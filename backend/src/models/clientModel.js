const db = require('../config/db');

const TABLE = 'clients';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [client] = await db(TABLE).insert(data).returning('*');
  return client;
}

async function update(id, data) {
  const [client] = await db(TABLE).where({ id }).update(data).returning('*');
  return client;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
