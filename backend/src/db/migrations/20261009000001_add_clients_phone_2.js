// Un client a au maximum 2 numéros de téléphone : phone + phone_2.
// Le second n'existe que si le premier est renseigné, et doit en être différent.
exports.up = async function (knex) {
  await knex.schema.alterTable('clients', (t) => {
    t.string('phone_2', 20);
  });
  await knex.schema.raw(`
    ALTER TABLE clients ADD CONSTRAINT clients_phone_2_check
      CHECK (phone_2 IS NULL OR (phone IS NOT NULL AND phone_2 <> phone));
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw('ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_phone_2_check;');
  await knex.schema.alterTable('clients', (t) => {
    t.dropColumn('phone_2');
  });
};
