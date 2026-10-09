const db = require('../config/db');

const TABLE = 'vehicles';

async function findAll() {
  return db(TABLE).select('*');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findByPlateNumber(plate_number) {
  return db(TABLE).where({ plate_number }).first();
}

// Recherche groupée (import Excel) : une requête au lieu d'une par véhicule.
async function findByPlateNumbers(plates) {
  if (plates.length === 0) return [];
  return db(TABLE).whereIn('plate_number', plates).select('*');
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

module.exports = { findAll, findById, findByPlateNumber, findByPlateNumbers, create, update, remove };
