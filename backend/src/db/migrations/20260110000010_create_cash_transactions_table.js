exports.up = function (knex) {
  return knex.schema.createTable('cash_transactions', (table) => {
    table.increments('id').primary();
    table.string('transaction_type', 10).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.decimal('balance_after', 15, 2);
    table.string('description', 255);
    table.string('beneficiary', 255);
    table.string('reference', 100);
    table.date('transaction_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cash_transactions');
};
