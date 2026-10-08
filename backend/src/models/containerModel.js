const db = require('../config/db');
const bookingModel = require('./bookingModel');

const TABLE = 'containers';

function conflictError(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

function notFoundError(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function applyFilters(query, { type, state, booking_id, client_id, is_processed } = {}) {
  if (type) query.where('type', type);
  if (state) query.where('state', state);
  if (booking_id) query.where('booking_id', booking_id);
  if (client_id) query.where('client_id', client_id);
  if (typeof is_processed === 'boolean') query.where('is_processed', is_processed);
  return query;
}

async function findAll(filters = {}) {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 20;
  const offset = (page - 1) * limit;

  const countQuery = applyFilters(db(TABLE), filters).count({ count: '*' }).first();
  const dataQuery = applyFilters(db(TABLE), filters)
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const [{ count }, data] = await Promise.all([countQuery, dataQuery]);
  const total = Number(count);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

async function findByContainerNumber(container_number, excludeId = null) {
  const query = db(TABLE).where({ container_number });
  if (excludeId) query.whereNot({ id: excludeId });
  return query.first();
}

async function findById(id) {
  const container = await db(TABLE).where({ id }).first();
  if (!container) return null;

  const [booking, client, movements] = await Promise.all([
    container.booking_id ? bookingModel.findById(container.booking_id) : null,
    container.client_id ? db('clients').where({ id: container.client_id }).first() : null,
    db('container_movements').where({ container_id: id }).select('*').orderBy('movement_datetime', 'desc'),
  ]);

  return { ...container, booking, client, movements };
}

async function create(data) {
  const existingNumber = await findByContainerNumber(data.container_number);
  if (existingNumber) {
    throw conflictError(`Le numéro de conteneur "${data.container_number}" est déjà utilisé.`);
  }

  const booking = await db('bookings').where({ id: data.booking_id }).whereNull('deleted_at').first();
  if (!booking) {
    throw notFoundError(`Le booking #${data.booking_id} n'existe pas.`);
  }

  if (data.client_id) {
    const client = await db('clients').where({ id: data.client_id }).first();
    if (!client) {
      throw notFoundError(`Le client #${data.client_id} n'existe pas.`);
    }
  }

  const [container] = await db(TABLE).insert(data).returning('*');
  return container;
}

async function update(id, data) {
  if (data.container_number) {
    const existingNumber = await findByContainerNumber(data.container_number, id);
    if (existingNumber) {
      throw conflictError(`Le numéro de conteneur "${data.container_number}" est déjà utilisé.`);
    }
  }

  if (data.booking_id) {
    const booking = await db('bookings').where({ id: data.booking_id }).whereNull('deleted_at').first();
    if (!booking) {
      throw notFoundError(`Le booking #${data.booking_id} n'existe pas.`);
    }
  }

  if (data.client_id) {
    const client = await db('clients').where({ id: data.client_id }).first();
    if (!client) {
      throw notFoundError(`Le client #${data.client_id} n'existe pas.`);
    }
  }

  const [container] = await db(TABLE).where({ id }).update(data).returning('*');
  return container || null;
}

async function remove(id) {
  const container = await db(TABLE).where({ id }).first();
  if (!container) return null;

  const { count } = await db('container_movements').where({ container_id: id }).count({ count: '*' }).first();
  if (Number(count) > 0) {
    throw conflictError('Impossible de supprimer un conteneur ayant des mouvements associés.');
  }

  await db(TABLE).where({ id }).del();
  return container;
}

async function markAsProcessed(id, { vehicle_id, driver_id } = {}) {
  const container = await db(TABLE).where({ id }).first();
  if (!container) return null;

  if (container.is_processed) {
    throw conflictError('Ce conteneur est déjà marqué comme traité.');
  }

  return db.transaction(async (trx) => {
    const now = trx.fn.now();

    const [updated] = await trx(TABLE)
      .where({ id })
      .update({ is_processed: true, departure_datetime: now })
      .returning('*');

    await trx('container_movements').insert({
      container_id: id,
      movement_type: 'IN',
      movement_datetime: now,
      vehicle_id: vehicle_id || null,
      driver_id: driver_id || null,
    });

    return updated;
  });
}

async function getMovements(id) {
  const container = await db(TABLE).where({ id }).first();
  if (!container) return null;

  return db('container_movements').where({ container_id: id }).select('*').orderBy('movement_datetime', 'desc');
}

// QTE_BK / QTE_ENL / SOLDE par type : même calcul que bookingModel.getStats,
// exposé ici pour respecter la spec du module containers sans dupliquer le SQL.
async function getStatsByBooking(bookingId) {
  return bookingModel.getStats(bookingId);
}

module.exports = {
  findAll,
  findById,
  findByContainerNumber,
  create,
  update,
  remove,
  markAsProcessed,
  getMovements,
  getStatsByBooking,
};
