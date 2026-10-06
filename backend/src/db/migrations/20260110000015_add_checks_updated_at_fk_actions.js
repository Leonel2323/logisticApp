const UPDATED_AT_TABLES = ['users', 'clients', 'drivers', 'vehicles', 'bookings', 'containers', 'chart_of_accounts'];

exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  for (const table of UPDATED_AT_TABLES) {
    await knex.schema.alterTable(table, (t) => {
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    await knex.schema.raw(`
      CREATE TRIGGER trg_${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  await knex.schema.raw(`
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IS NULL OR role IN ('admin', 'supervisor', 'operator'));
    ALTER TABLE clients ADD CONSTRAINT clients_type_check
      CHECK (type IS NULL OR type IN ('client', 'fournisseur', 'salarie'));
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
      CHECK (status IS NULL OR status IN ('en_cours', 'cloture', 'retard'));
    ALTER TABLE containers ADD CONSTRAINT containers_type_check
      CHECK (type IN ('40FT', '20FT', '10FT'));
    ALTER TABLE containers ADD CONSTRAINT containers_state_check
      CHECK (state IN ('PLEIN', 'VIDE'));
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_type_check
      CHECK (type IN ('TRACTEUR', 'REMORQUE', 'CAMION'));
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check
      CHECK (status IS NULL OR status IN ('disponible', 'en_mission', 'maintenance'));
    ALTER TABLE container_movements ADD CONSTRAINT container_movements_movement_type_check
      CHECK (movement_type IN ('IN', 'OUT'));
    ALTER TABLE cash_transactions ADD CONSTRAINT cash_transactions_transaction_type_check
      CHECK (transaction_type IN ('IN', 'OUT'));
    ALTER TABLE chart_of_accounts ADD CONSTRAINT chart_of_accounts_nature_check
      CHECK (nature IS NULL OR nature IN ('BILAN', 'CHARGE', 'PRODUIT'));
    ALTER TABLE chart_of_accounts ADD CONSTRAINT chart_of_accounts_sens_check
      CHECK (sens IS NULL OR sens IN ('DEBIT', 'CREDIT', 'BOTH'));
  `);

  await knex.schema.raw(`
    ALTER TABLE vehicles DROP CONSTRAINT vehicles_driver_id_foreign;
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_driver_id_foreign
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

    ALTER TABLE bookings DROP CONSTRAINT bookings_client_id_foreign;
    ALTER TABLE bookings ADD CONSTRAINT bookings_client_id_foreign
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

    ALTER TABLE containers DROP CONSTRAINT containers_booking_id_foreign;
    ALTER TABLE containers ADD CONSTRAINT containers_booking_id_foreign
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT;

    ALTER TABLE containers DROP CONSTRAINT containers_client_id_foreign;
    ALTER TABLE containers ADD CONSTRAINT containers_client_id_foreign
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

    ALTER TABLE container_movements DROP CONSTRAINT container_movements_container_id_foreign;
    ALTER TABLE container_movements ADD CONSTRAINT container_movements_container_id_foreign
      FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE RESTRICT;

    ALTER TABLE container_movements DROP CONSTRAINT container_movements_vehicle_id_foreign;
    ALTER TABLE container_movements ADD CONSTRAINT container_movements_vehicle_id_foreign
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

    ALTER TABLE container_movements DROP CONSTRAINT container_movements_driver_id_foreign;
    ALTER TABLE container_movements ADD CONSTRAINT container_movements_driver_id_foreign
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

    ALTER TABLE fuel_transactions DROP CONSTRAINT fuel_transactions_vehicle_id_foreign;
    ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_vehicle_id_foreign
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

    ALTER TABLE sales DROP CONSTRAINT sales_client_id_foreign;
    ALTER TABLE sales ADD CONSTRAINT sales_client_id_foreign
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

    ALTER TABLE sales DROP CONSTRAINT sales_container_id_foreign;
    ALTER TABLE sales ADD CONSTRAINT sales_container_id_foreign
      FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE RESTRICT;
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE sales DROP CONSTRAINT sales_container_id_foreign;
    ALTER TABLE sales ADD CONSTRAINT sales_container_id_foreign
      FOREIGN KEY (container_id) REFERENCES containers(id);

    ALTER TABLE sales DROP CONSTRAINT sales_client_id_foreign;
    ALTER TABLE sales ADD CONSTRAINT sales_client_id_foreign
      FOREIGN KEY (client_id) REFERENCES clients(id);

    ALTER TABLE fuel_transactions DROP CONSTRAINT fuel_transactions_vehicle_id_foreign;
    ALTER TABLE fuel_transactions ADD CONSTRAINT fuel_transactions_vehicle_id_foreign
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);

    ALTER TABLE container_movements DROP CONSTRAINT container_movements_driver_id_foreign;
    ALTER TABLE container_movements ADD CONSTRAINT container_movements_driver_id_foreign
      FOREIGN KEY (driver_id) REFERENCES drivers(id);

    ALTER TABLE container_movements DROP CONSTRAINT container_movements_vehicle_id_foreign;
    ALTER TABLE container_movements ADD CONSTRAINT container_movements_vehicle_id_foreign
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);

    ALTER TABLE container_movements DROP CONSTRAINT container_movements_container_id_foreign;
    ALTER TABLE container_movements ADD CONSTRAINT container_movements_container_id_foreign
      FOREIGN KEY (container_id) REFERENCES containers(id);

    ALTER TABLE containers DROP CONSTRAINT containers_client_id_foreign;
    ALTER TABLE containers ADD CONSTRAINT containers_client_id_foreign
      FOREIGN KEY (client_id) REFERENCES clients(id);

    ALTER TABLE containers DROP CONSTRAINT containers_booking_id_foreign;
    ALTER TABLE containers ADD CONSTRAINT containers_booking_id_foreign
      FOREIGN KEY (booking_id) REFERENCES bookings(id);

    ALTER TABLE bookings DROP CONSTRAINT bookings_client_id_foreign;
    ALTER TABLE bookings ADD CONSTRAINT bookings_client_id_foreign
      FOREIGN KEY (client_id) REFERENCES clients(id);

    ALTER TABLE vehicles DROP CONSTRAINT vehicles_driver_id_foreign;
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_driver_id_foreign
      FOREIGN KEY (driver_id) REFERENCES drivers(id);
  `);

  await knex.schema.raw(`
    ALTER TABLE chart_of_accounts DROP CONSTRAINT chart_of_accounts_sens_check;
    ALTER TABLE chart_of_accounts DROP CONSTRAINT chart_of_accounts_nature_check;
    ALTER TABLE cash_transactions DROP CONSTRAINT cash_transactions_transaction_type_check;
    ALTER TABLE container_movements DROP CONSTRAINT container_movements_movement_type_check;
    ALTER TABLE vehicles DROP CONSTRAINT vehicles_status_check;
    ALTER TABLE vehicles DROP CONSTRAINT vehicles_type_check;
    ALTER TABLE containers DROP CONSTRAINT containers_state_check;
    ALTER TABLE containers DROP CONSTRAINT containers_type_check;
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
    ALTER TABLE clients DROP CONSTRAINT clients_type_check;
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  `);

  for (const table of UPDATED_AT_TABLES) {
    await knex.schema.raw(`DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table};`);
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn('updated_at');
    });
  }

  await knex.schema.raw('DROP FUNCTION IF EXISTS set_updated_at();');
};
