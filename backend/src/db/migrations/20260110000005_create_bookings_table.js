exports.up = function (knex) {
  return knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table.string('booking_number', 50).notNullable().unique();
    table.string('shipping_company', 100).notNullable();
    table.integer('client_id').references('id').inTable('clients');
    table.date('start_date').notNullable();
    table.date('end_date');
    table.string('status', 50).defaultTo('en_cours');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('bookings');
};
