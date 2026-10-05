const db = require('../config/db');

const TABLE = 'users';

async function findAll() {
  return db(TABLE).select('id', 'name', 'email', 'role', 'is_active', 'created_at');
}

async function findById(id) {
  return db(TABLE).select('id', 'name', 'email', 'role', 'is_active', 'created_at').where({ id }).first();
}

async function findByEmail(email) {
  return db(TABLE).where({ email }).first();
}

async function create(data) {
  const [user] = await db(TABLE).insert(data).returning('*');
  return user;
}

async function update(id, data) {
  const [user] = await db(TABLE).where({ id }).update(data).returning('*');
  return user;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, findByEmail, create, update, remove };
