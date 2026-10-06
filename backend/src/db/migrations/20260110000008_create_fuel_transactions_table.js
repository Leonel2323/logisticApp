exports.up = function (knex) {
  return knex.schema.createTable('fuel_transactions', (table) => {
    table.increments('id').primary();
    table.integer('vehicle_id').references('id').inTable('vehicles');
    table.decimal('quantity_liters', 10, 2).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.integer('mileage');
    table.string('station', 100);
    table.date('transaction_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('fuel_transactions');
};
