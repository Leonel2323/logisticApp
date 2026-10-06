exports.up = function (knex) {
  return knex.schema.createTable('drivers', (table) => {
    table.increments('id').primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20);
    table.string('email', 255);
    table.string('permit_number', 50);
    table.string('permit_category', 10);
    table.date('permit_expiry');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('drivers');
};
