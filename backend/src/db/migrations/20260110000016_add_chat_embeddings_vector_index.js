exports.up = function (knex) {
  return knex.schema.raw(
    'CREATE INDEX idx_chat_embeddings_embedding ON chat_embeddings USING hnsw (embedding vector_cosine_ops)'
  );
};

exports.down = function (knex) {
  return knex.schema.raw('DROP INDEX IF EXISTS idx_chat_embeddings_embedding');
};
