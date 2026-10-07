exports.up = async function (knex) {
  await knex.schema.raw(`CREATE INDEX idx_expenses_account_number ON expenses(account_number);`);
};

exports.down = async function (knex) {
  await knex.schema.raw(`DROP INDEX IF EXISTS idx_expenses_account_number;`);
};
