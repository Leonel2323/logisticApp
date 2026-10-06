exports.up = function (knex) {
  return knex.schema.createTable('chart_of_accounts', (table) => {
    table.increments('id').primary();
    table.string('account_number', 10).notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('short_name', 100);
    table.string('nature', 50);
    table.string('sens', 20);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('chart_of_accounts');
};
