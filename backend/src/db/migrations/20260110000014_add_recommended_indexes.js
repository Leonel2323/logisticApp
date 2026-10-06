exports.up = function (knex) {
  return knex.schema.raw(`
    CREATE INDEX idx_containers_booking ON containers(booking_id);
    CREATE INDEX idx_containers_type_state ON containers(type, state);
    CREATE INDEX idx_containers_is_processed ON containers(is_processed);
    CREATE INDEX idx_bookings_client ON bookings(client_id);
    CREATE INDEX idx_bookings_status ON bookings(status);
    CREATE INDEX idx_movements_container ON container_movements(container_id);
    CREATE INDEX idx_movements_datetime ON container_movements(movement_datetime);
    CREATE INDEX idx_sales_date ON sales(sale_date);
    CREATE INDEX idx_fuel_vehicle ON fuel_transactions(vehicle_id);
    CREATE INDEX idx_cash_date ON cash_transactions(transaction_date);
  `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    DROP INDEX IF EXISTS idx_cash_date;
    DROP INDEX IF EXISTS idx_fuel_vehicle;
    DROP INDEX IF EXISTS idx_sales_date;
    DROP INDEX IF EXISTS idx_movements_datetime;
    DROP INDEX IF EXISTS idx_movements_container;
    DROP INDEX IF EXISTS idx_bookings_status;
    DROP INDEX IF EXISTS idx_bookings_client;
    DROP INDEX IF EXISTS idx_containers_is_processed;
    DROP INDEX IF EXISTS idx_containers_type_state;
    DROP INDEX IF EXISTS idx_containers_booking;
  `);
};
