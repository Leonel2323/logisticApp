const db = require('../config/db');

const TABLE = 'container_movements';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [movement] = await db(TABLE).insert(data).returning('*');
  return movement;
}

async function update(id, data) {
  const [movement] = await db(TABLE).where({ id }).update(data).returning('*');
  return movement;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
