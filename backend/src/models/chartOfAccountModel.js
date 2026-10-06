const db = require('../config/db');

const TABLE = 'chart_of_accounts';

async function findAll() {
  return db(TABLE).select('*').orderBy('account_number');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [account] = await db(TABLE).insert(data).returning('*');
  return account;
}

async function update(id, data) {
  const [account] = await db(TABLE).where({ id }).update(data).returning('*');
  return account;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
