exports.up = function (knex) {
  return knex.schema.createTable('clients', (table) => {
    table.increments('id').primary();
    table.string('code', 20).notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('type', 50);
    table.string('phone', 20);
    table.string('email', 255);
    table.string('country', 100).defaultTo('Cameroun');
    table.string('region', 100);
    table.string('city', 100);
    table.string('street', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('clients');
};
