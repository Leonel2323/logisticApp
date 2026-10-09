const db = require('../config/db');

const TABLE = 'bookings';

function conflictError(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

function applyFilters(query, { status, shipping_company, client_id, search } = {}) {
  if (status) query.where('status', status);
  if (shipping_company) query.where('shipping_company', shipping_company);
  if (client_id) query.where('client_id', client_id);
  if (search) {
    query.where((qb) => {
      qb.whereILike('booking_number', `%${search}%`).orWhereILike('shipping_company', `%${search}%`);
    });
  }
  return query;
}

async function findAll(filters = {}) {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 20;
  const offset = (page - 1) * limit;

  const countQuery = applyFilters(db(TABLE).whereNull('deleted_at'), filters).count({ count: '*' }).first();
  const dataQuery = applyFilters(db(TABLE).whereNull('deleted_at'), filters)
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

async function findById(id) {
  const booking = await db(TABLE).where({ id }).whereNull('deleted_at').first();
  if (!booking) return null;

  const containers = await db('containers').where({ booking_id: id }).select('*');
  return { ...booking, containers };
}

async function findByBookingNumber(booking_number, excludeId = null) {
  const query = db(TABLE).where({ booking_number });
  if (excludeId) query.whereNot({ id: excludeId });
  return query.first();
}

// Recherche groupée (import Excel). Comme findByBookingNumber, inclut les
// bookings supprimés : le numéro reste unique en base.
async function findByBookingNumbers(numbers) {
  if (numbers.length === 0) return [];
  return db(TABLE).whereIn('booking_number', numbers).select('*');
}

async function create(data) {
  const existing = await findByBookingNumber(data.booking_number);
  if (existing) {
    throw conflictError(`Le numéro de booking "${data.booking_number}" est déjà utilisé.`);
  }

  const [booking] = await db(TABLE).insert(data).returning('*');
  return booking;
}

async function update(id, data) {
  if (data.booking_number) {
    const existing = await findByBookingNumber(data.booking_number, id);
    if (existing) {
      throw conflictError(`Le numéro de booking "${data.booking_number}" est déjà utilisé.`);
    }
  }

  const [booking] = await db(TABLE).where({ id }).whereNull('deleted_at').update(data).returning('*');
  return booking || null;
}

async function remove(id) {
  const booking = await db(TABLE).where({ id }).whereNull('deleted_at').first();
  if (!booking) return null;

  if (booking.status !== 'cloture') {
    throw conflictError('Seule une réservation clôturée peut être supprimée.');
  }

  await db(TABLE).where({ id }).update({ deleted_at: db.fn.now() });
  return booking;
}

async function listShippingCompanies() {
  const rows = await db(TABLE)
    .whereNull('deleted_at')
    .distinct('shipping_company')
    .orderBy('shipping_company');
  return rows.map((row) => row.shipping_company);
}

// Une ligne par type de conteneur (40FT, 20FT, 10FT — cf. CHECK containers_type_check),
// y compris les types sans conteneur (COUNT = 0) grâce au CROSS JOIN sur la liste
// des types. Aucune ligne si le booking n'existe pas ou est supprimé.
// Les dates sont formatées en SQL : node-pg convertirait une colonne `date` en
// objet Date local, décalé d'un jour une fois sérialisé en UTC.
async function getStats(id) {
  const { rows } = await db.raw(
    `SELECT b.id,
            b.booking_number,
            b.shipping_company,
            b.status,
            to_char(b.start_date, 'YYYY-MM-DD') AS start_date,
            to_char(b.end_date, 'YYYY-MM-DD') AS end_date,
            b.end_date < (now() AT TIME ZONE 'Africa/Douala')::date AS is_past_end_date,
            c.id AS client_id,
            c.name AS client_name,
            t.type,
            COUNT(ct.id)::int AS qte_bk,
            COUNT(ct.id) FILTER (WHERE ct.is_processed)::int AS qte_enl
       FROM bookings b
       LEFT JOIN clients c ON c.id = b.client_id
      CROSS JOIN (VALUES ('40FT', 1), ('20FT', 2), ('10FT', 3)) AS t(type, position)
       LEFT JOIN containers ct ON ct.booking_id = b.id AND ct.type = t.type
      WHERE b.id = ? AND b.deleted_at IS NULL
      GROUP BY b.id, c.id, t.type, t.position
      ORDER BY t.position`,
    [id]
  );
  return rows;
}

module.exports = { findAll, findById, findByBookingNumber, findByBookingNumbers, create, update, remove, getStats, listShippingCompanies };
