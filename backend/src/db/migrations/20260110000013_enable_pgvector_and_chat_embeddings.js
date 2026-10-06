exports.up = async function (knex) {
  await knex.schema.raw('CREATE EXTENSION IF NOT EXISTS vector');
  await knex.schema.raw(`
    CREATE TABLE chat_embeddings (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      embedding VECTOR(384),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw('DROP TABLE IF EXISTS chat_embeddings');
};
