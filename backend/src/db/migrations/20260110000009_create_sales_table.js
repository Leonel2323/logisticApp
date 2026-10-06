exports.up = function (knex) {
  return knex.schema.createTable('sales', (table) => {
    table.increments('id').primary();
    table.integer('container_id').references('id').inTable('containers');
    table.integer('client_id').references('id').inTable('clients');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 15, 2).notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.date('sale_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales');
};
