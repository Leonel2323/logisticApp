exports.up = function (knex) {
  return knex.schema.createTable('container_movements', (table) => {
    table.increments('id').primary();
    table.integer('container_id').references('id').inTable('containers');
    table.string('movement_type', 10).notNullable();
    table.timestamp('movement_datetime').notNullable();
    table.integer('vehicle_id').references('id').inTable('vehicles');
    table.integer('driver_id').references('id').inTable('drivers');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('container_movements');
};
