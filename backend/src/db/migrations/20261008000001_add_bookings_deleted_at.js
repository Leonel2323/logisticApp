exports.up = async function (knex) {
  await knex.schema.alterTable('bookings', (t) => {
    t.timestamp('deleted_at', { useTz: true });
  });
  await knex.schema.raw('CREATE INDEX idx_bookings_deleted_at ON bookings(deleted_at);');
};

exports.down = async function (knex) {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_bookings_deleted_at;');
  await knex.schema.alterTable('bookings', (t) => {
    t.dropColumn('deleted_at');
  });
};
