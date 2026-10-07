exports.up = async function (knex) {
  // 1. Missing FK covering indexes (performance advisor)
  await knex.schema.raw(`
    CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
    CREATE INDEX idx_containers_client ON containers(client_id);
    CREATE INDEX idx_sales_client ON sales(client_id);
    CREATE INDEX idx_sales_container ON sales(container_id);
    CREATE INDEX idx_movements_driver ON container_movements(driver_id);
    CREATE INDEX idx_movements_vehicle ON container_movements(vehicle_id);
  `);

  // 2. chat_embeddings.created_at: align type with every other table (timestamptz)
  await knex.schema.raw(`
    ALTER TABLE chat_embeddings
      ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
  `);

  // 3. chart_of_accounts: add missing created_at (only table without it)
  await knex.schema.alterTable('chart_of_accounts', (t) => {
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 4. Harden set_updated_at() against mutable search_path (security advisor)
  await knex.schema.raw(`
    ALTER FUNCTION set_updated_at() SET search_path = public, pg_temp;
  `);

  // 5. Move vector extension out of public schema (security advisor)
  await knex.schema.raw(`ALTER EXTENSION vector SET SCHEMA extensions;`);

  // 6. This app is accessed exclusively through the Express backend (role
  // `postgres`, bypasses RLS). Revoke Supabase's default anon/authenticated
  // grants as defense in depth; RLS stays enabled with no policies
  // (default-deny) as a second layer.
  await knex.schema.raw(`
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
  `);

  // 7. Positivity checks on monetary/quantity columns
  await knex.schema.raw(`
    ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_quantity_positive_check
      CHECK (quantity_liters > 0);
    ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_amount_positive_check
      CHECK (amount > 0);
    ALTER TABLE sales ADD CONSTRAINT sales_quantity_positive_check
      CHECK (quantity > 0);
    ALTER TABLE sales ADD CONSTRAINT sales_unit_price_positive_check
      CHECK (unit_price > 0);
    ALTER TABLE sales ADD CONSTRAINT sales_total_amount_positive_check
      CHECK (total_amount > 0);
    ALTER TABLE cash_transactions ADD CONSTRAINT cash_transactions_amount_positive_check
      CHECK (amount > 0);
  `);

  // 8. sales.total_amount must equal quantity * unit_price
  await knex.schema.raw(`
    ALTER TABLE sales ADD CONSTRAINT sales_total_amount_consistency_check
      CHECK (total_amount = quantity * unit_price);
  `);

  // 9. expenses.account_number must reference a real chart_of_accounts entry
  await knex.schema.raw(`
    ALTER TABLE expenses ADD CONSTRAINT expenses_account_number_foreign
      FOREIGN KEY (account_number) REFERENCES chart_of_accounts(account_number) ON DELETE RESTRICT;
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE expenses DROP CONSTRAINT expenses_account_number_foreign;
  `);

  await knex.schema.raw(`
    ALTER TABLE sales DROP CONSTRAINT sales_total_amount_consistency_check;
  `);

  await knex.schema.raw(`
    ALTER TABLE cash_transactions DROP CONSTRAINT cash_transactions_amount_positive_check;
    ALTER TABLE sales DROP CONSTRAINT sales_total_amount_positive_check;
    ALTER TABLE sales DROP CONSTRAINT sales_unit_price_positive_check;
    ALTER TABLE sales DROP CONSTRAINT sales_quantity_positive_check;
    ALTER TABLE fuel_transactions DROP CONSTRAINT fuel_transactions_amount_positive_check;
    ALTER TABLE fuel_transactions DROP CONSTRAINT fuel_transactions_quantity_positive_check;
  `);

  await knex.schema.raw(`
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  `);

  await knex.schema.raw(`ALTER EXTENSION vector SET SCHEMA public;`);

  await knex.schema.raw(`
    ALTER FUNCTION set_updated_at() RESET search_path;
  `);

  await knex.schema.alterTable('chart_of_accounts', (t) => {
    t.dropColumn('created_at');
  });

  await knex.schema.raw(`
    ALTER TABLE chat_embeddings
      ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN created_at SET DEFAULT NOW();
  `);

  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_movements_vehicle;
    DROP INDEX IF EXISTS idx_movements_driver;
    DROP INDEX IF EXISTS idx_sales_container;
    DROP INDEX IF EXISTS idx_sales_client;
    DROP INDEX IF EXISTS idx_containers_client;
    DROP INDEX IF EXISTS idx_vehicles_driver;
  `);
};
