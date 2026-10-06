exports.up = function (knex) {
  return knex.schema.createTable('containers', (table) => {
    table.increments('id').primary();
    table.string('container_number', 50).notNullable().unique();
    table.string('type', 10).notNullable();
    table.string('state', 10).notNullable();
    table.string('merchandise', 255);
    table.integer('booking_id').references('id').inTable('bookings');
    table.integer('client_id').references('id').inTable('clients');
    table.boolean('is_processed').defaultTo(false);
    table.timestamp('arrival_datetime');
    table.timestamp('departure_datetime');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('containers');
};
