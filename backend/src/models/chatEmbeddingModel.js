const db = require('../config/db');

const TABLE = 'chat_embeddings';

function toVectorLiteral(embedding) {
  return db.raw('?::vector', [`[${embedding.join(',')}]`]);
}

function normalize(data) {
  if (!Array.isArray(data.embedding)) return data;
  return { ...data, embedding: toVectorLiteral(data.embedding) };
}

async function findAll() {
  return db(TABLE).select('id', 'content', 'metadata', 'created_at');
}

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function create(data) {
  const [row] = await db(TABLE).insert(normalize(data)).returning(['id', 'content', 'metadata', 'created_at']);
  return row;
}

async function update(id, data) {
  const [row] = await db(TABLE)
    .where({ id })
    .update(normalize(data))
    .returning(['id', 'content', 'metadata', 'created_at']);
  return row;
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { findAll, findById, create, update, remove };
