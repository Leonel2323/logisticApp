exports.up = function (knex) {
  return knex.schema.createTable('vehicles', (table) => {
    table.increments('id').primary();
    table.string('plate_number', 50).notNullable().unique();
    table.string('type', 50).notNullable();
    table.integer('driver_id').references('id').inTable('drivers');
    table.string('status', 50).defaultTo('disponible');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('vehicles');
};
