exports.up = function (knex) {
  return knex.schema.createTable('expenses', (table) => {
    table.increments('id').primary();
    table.string('account_number', 10).notNullable();
    table.string('account_name', 255);
    table.string('details', 255);
    table.decimal('amount', 15, 2).notNullable();
    table.date('expense_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('expenses');
};
