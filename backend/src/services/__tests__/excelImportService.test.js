jest.mock('../../models/clientModel', () => ({
  findAll: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../../models/bookingModel', () => ({
  findByBookingNumber: jest.fn(),
  findByBookingNumbers: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../models/vehicleModel', () => ({
  findByPlateNumber: jest.fn(),
  findByPlateNumbers: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../models/containerModel', () => ({
  findByContainerNumber: jest.fn(),
  findByContainerNumbers: jest.fn(),
  create: jest.fn(),
  markAsProcessed: jest.fn(),
}));

const clientModel = require('../../models/clientModel');
const bookingModel = require('../../models/bookingModel');
const vehicleModel = require('../../models/vehicleModel');
const containerModel = require('../../models/containerModel');
const {
  parseDate,
  parseTime,
  parseContainerType,
  parseState,
  parseIn,
  nameKey,
  normalizePlate,
  normalizeContainerNumber,
  cellValue,
  mapHeaders,
  extractRows,
  importRows,
  readWorkbook,
} = require('../excelImportService');

// Base de données en mémoire branchée sur les modèles mockés.
function createStore({ clients = [], bookings = [], vehicles = [], containers = [] } = {}) {
  const store = { clients, bookings, vehicles, containers, movements: [] };
  let nextId = 1000;

  clientModel.findAll.mockImplementation(async () => store.clients.map((c) => ({ ...c })));
  clientModel.findByName.mockImplementation(async (name) => store.clients.find((c) => c.name === name));
  clientModel.create.mockImplementation(async (data) => {
    const client = { id: (nextId += 1), ...data };
    store.clients.push(client);
    return client;
  });

  clientModel.update.mockImplementation(async (id, data) => {
    const client = store.clients.find((c) => c.id === id);
    Object.assign(client, data);
    return client;
  });

  bookingModel.findByBookingNumber.mockImplementation(async (number) =>
    store.bookings.find((b) => b.booking_number === number)
  );
  bookingModel.findByBookingNumbers.mockImplementation(async (numbers) =>
    store.bookings.filter((b) => numbers.includes(b.booking_number))
  );
  bookingModel.create.mockImplementation(async (data) => {
    const booking = { id: (nextId += 1), deleted_at: null, ...data };
    store.bookings.push(booking);
    return booking;
  });

  vehicleModel.findByPlateNumber.mockImplementation(async (plate) =>
    store.vehicles.find((v) => v.plate_number === plate)
  );
  vehicleModel.findByPlateNumbers.mockImplementation(async (plates) =>
    store.vehicles.filter((v) => plates.includes(v.plate_number))
  );
  vehicleModel.create.mockImplementation(async (data) => {
    const vehicle = { id: (nextId += 1), ...data };
    store.vehicles.push(vehicle);
    return vehicle;
  });

  containerModel.findByContainerNumber.mockImplementation(async (number) =>
    store.containers.find((c) => c.container_number === number)
  );
  containerModel.findByContainerNumbers.mockImplementation(async (numbers) =>
    store.containers.filter((c) => numbers.includes(c.container_number))
  );
  containerModel.create.mockImplementation(async (data) => {
    const container = { id: (nextId += 1), is_processed: false, ...data };
    store.containers.push(container);
    return container;
  });
  containerModel.markAsProcessed.mockImplementation(async (id, { vehicle_id, processed_at } = {}) => {
    const container = store.containers.find((c) => c.id === id);
    container.is_processed = true;
    store.movements.push({ container_id: id, movement_type: 'IN', movement_datetime: processed_at, vehicle_id: vehicle_id || null });
    return container;
  });

  return store;
}

function row(excelRow, overrides = {}) {
  return {
    excelRow,
    date: '2026-04-02 00:00:00',
    time: '08:30',
    container_number: 'MSCU1234567',
    merchandise: 'Cacao',
    type: '40',
    booking_number: 'ZU1400003',
    shipping_company: 'YANG MING',
    state: 'P',
    client: 'WOURI LOGISTICS',
    phone: '699 00 00 00',
    tractor: 'LT 123 AB',
    trailer: 'LT 456 CD',
    in: 1,
    ...overrides,
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseDate', () => {
  it.each([
    ['2026-04-01 00:00:00', '2026-04-01'],
    ['2026-04-01', '2026-04-01'],
    ['01/04/2026', '2026-04-01'],
    ['1/4/2026', '2026-04-01'],
    [new Date(Date.UTC(2026, 3, 1)), '2026-04-01'],
    [46113, '2026-04-01'],
  ])('parses %p', (input, expected) => {
    expect(parseDate(input)).toBe(expected);
  });

  it.each([['31/02/2026'], ['2026-13-01'], ['demain'], [''], [null]])('rejects %p', (input) => {
    expect(parseDate(input)).toBeNull();
  });
});

describe('parseTime', () => {
  it.each([
    ['08:30', '08:30'],
    ['8h30', '08:30'],
    ['14:05:00', '14:05'],
    [new Date(Date.UTC(1899, 11, 30, 8, 30)), '08:30'],
    [0.5, '12:00'],
  ])('parses %p', (input, expected) => {
    expect(parseTime(input)).toBe(expected);
  });

  it.each([['25:00'], ['midi'], [''], [null]])('rejects %p', (input) => {
    expect(parseTime(input)).toBeNull();
  });
});

describe('field normalizers', () => {
  it('normalizes container types', () => {
    expect(parseContainerType('40')).toBe('40FT');
    expect(parseContainerType("40'HC")).toBe('40FT');
    expect(parseContainerType('20 ft')).toBe('20FT');
    expect(parseContainerType('10FT')).toBe('10FT');
    expect(parseContainerType('45')).toBeNull();
    expect(parseContainerType(null)).toBeNull();
  });

  it('converts P/V states', () => {
    expect(parseState('P')).toBe('PLEIN');
    expect(parseState(' v ')).toBe('VIDE');
    expect(parseState('Plein')).toBe('PLEIN');
    expect(parseState('X')).toBeNull();
  });

  it('reads the IN flag', () => {
    expect(parseIn(1)).toBe(true);
    expect(parseIn('1')).toBe(true);
    expect(parseIn(0)).toBe(false);
    expect(parseIn(null)).toBe(false);
    expect(parseIn('')).toBe(false);
    expect(parseIn('oui')).toBeNull();
  });

  it('builds a comparison key insensitive to case, accents and spaces', () => {
    expect(nameKey('  Société   Générale ')).toBe('SOCIETE GENERALE');
    expect(nameKey('SOCIETE GENERALE')).toBe('SOCIETE GENERALE');
  });

  it('normalizes plate and container numbers', () => {
    expect(normalizePlate(' lt 123  ab ')).toBe('LT123AB');
    expect(normalizeContainerNumber('mscu 123456-7')).toBe('MSCU1234567');
  });

  it('unwraps exceljs cell values', () => {
    expect(cellValue({ richText: [{ text: 'AB' }, { text: 'C' }] })).toBe('ABC');
    expect(cellValue({ formula: 'A1', result: 42 })).toBe(42);
    expect(cellValue({ text: 'lien', hyperlink: 'http://x' })).toBe('lien');
    expect(cellValue({ error: '#N/A' })).toBeNull();
    expect(cellValue(undefined)).toBeNull();
  });
});

describe('mapHeaders', () => {
  it('maps the Excel headers whatever their accents, spaces or punctuation', () => {
    const headers = [
      undefined,
      'DATE', 'HEURE', 'N°TC', 'MARCHANDISES', 'TYPE TC', 'N° BOOKING', 'COMPAGNIE',
      'ETAT (P/V)', 'CLIENTS', 'CONTACT_TEL', 'IM_TRAC', 'IM_REMORQUE', 'IN',
    ];

    expect(mapHeaders(headers)).toEqual({
      date: 1, time: 2, container_number: 3, merchandise: 4, type: 5, booking_number: 6,
      shipping_company: 7, state: 8, client: 9, phone: 10, tractor: 11, trailer: 12, in: 13,
    });
  });

  it('returns null when a required column is missing', () => {
    expect(mapHeaders([undefined, 'DATE', 'N°TC'])).toBeNull();
  });
});

describe('importRows', () => {
  it('creates clients, bookings, vehicles, containers and IN movements', async () => {
    const store = createStore({ clients: [{ id: 62, code: 'CLI0062', name: 'AUTRE CLIENT' }] });
    const rows = [
      row(2),
      row(3, { date: '01/04/2026', container_number: 'MSCU7654321', type: '20', state: 'V', in: 0 }),
    ];

    const report = await importRows(rows);

    expect(report.created).toEqual({ clients: 1, bookings: 1, tractors: 1, trailers: 1, containers: 2, movements: 1 });
    expect(report.errors).toEqual([]);

    const client = store.clients.find((c) => c.name === 'WOURI LOGISTICS');
    expect(client).toMatchObject({ code: 'CLI0063', phone: '699 00 00 00' });

    // start_date = date la plus ancienne vue pour ce booking, même si elle apparaît après.
    expect(store.bookings[0]).toMatchObject({
      booking_number: 'ZU1400003',
      shipping_company: 'YANG MING',
      client_id: client.id,
      start_date: '2026-04-01',
    });

    expect(store.vehicles).toEqual([
      expect.objectContaining({ plate_number: 'LT123AB', type: 'TRACTEUR' }),
      expect.objectContaining({ plate_number: 'LT456CD', type: 'REMORQUE' }),
    ]);

    expect(store.containers[0]).toMatchObject({
      container_number: 'MSCU1234567',
      type: '40FT',
      state: 'PLEIN',
      merchandise: 'Cacao',
      booking_id: store.bookings[0].id,
      client_id: client.id,
      arrival_datetime: '2026-04-02T08:30:00+01:00',
      is_processed: true,
    });
    expect(store.containers[1]).toMatchObject({ type: '20FT', state: 'VIDE', is_processed: false });
    expect(store.movements).toEqual([
      {
        container_id: store.containers[0].id,
        movement_type: 'IN',
        movement_datetime: '2026-04-02T08:30:00+01:00',
        vehicle_id: store.vehicles[0].id,
      },
    ]);
  });

  it('is idempotent: a second run creates nothing', async () => {
    const store = createStore();
    const rows = [row(2), row(3, { container_number: 'MSCU7654321', in: 0 })];

    await importRows(rows);
    const second = await importRows(rows);

    expect(second.created).toEqual({ clients: 0, bookings: 0, tractors: 0, trailers: 0, containers: 0, movements: 0 });
    expect(second.skipped).toBe(2);
    expect(store.clients).toHaveLength(1);
    expect(store.bookings).toHaveLength(1);
    expect(store.vehicles).toHaveLength(2);
    expect(store.containers).toHaveLength(2);
    expect(store.movements).toHaveLength(1);
  });

  it('reuses rows repeated inside the same file without duplicating them', async () => {
    const store = createStore();

    const report = await importRows([row(2), row(3)]);

    expect(report.created.containers).toBe(1);
    expect(report.skipped).toBe(1);
    expect(store.movements).toHaveLength(1);
  });

  it('rejects a container number already used by another booking, without touching anything', async () => {
    const store = createStore({
      bookings: [{ id: 50, booking_number: 'DEMO001', deleted_at: null }],
      containers: [{ id: 538, container_number: 'TCNU00038', booking_id: 50, is_processed: false }],
    });

    const report = await importRows([row(2, { container_number: 'TCNU00038', booking_number: 'BK9900003' })]);

    expect(report.errors).toEqual([{ row: 2, message: expect.stringContaining('autre booking') }]);
    expect(store.containers[0].is_processed).toBe(false);
    expect(store.movements).toHaveLength(0);
    expect(store.bookings).toHaveLength(1);
    expect(store.clients).toHaveLength(0);
    expect(store.vehicles).toHaveLength(0);
  });

  it('marks an existing container as processed when IN switches to 1', async () => {
    const store = createStore();
    await importRows([row(2, { in: 0 })]);

    const report = await importRows([row(2, { in: 1 })]);

    expect(report.created.movements).toBe(1);
    expect(store.containers[0].is_processed).toBe(true);
  });

  it('matches existing clients regardless of case, accents and extra spaces', async () => {
    const store = createStore({ clients: [{ id: 5, code: 'CLI0005', name: 'Société Wouri' }] });

    const report = await importRows([row(2, { client: '  SOCIETE   WOURI ' })]);

    expect(report.created.clients).toBe(0);
    expect(store.bookings[0].client_id).toBe(5);
  });

  it('truncates the phone number to 20 characters', async () => {
    const store = createStore();

    await importRows([row(2, { phone: '+237 699 00 00 00 / 677 00 00 00' })]);

    expect(store.clients[0].phone).toBe('+237 699 00 00 00 / ');
  });

  it('warns about duplicate client names and uses the oldest client', async () => {
    const store = createStore({
      clients: [
        { id: 9, code: 'CLI0009', name: 'WOURI LOGISTICS ' },
        { id: 4, code: 'CLI0004', name: 'Wouri Logistics' },
      ],
    });

    const report = await importRows([row(2)]);

    expect(store.bookings[0].client_id).toBe(4);
    expect(report.warnings).toEqual([expect.stringContaining('#4, #9')]);
  });

  it('refuses to attach containers to a deleted booking', async () => {
    const store = createStore({
      bookings: [{ id: 7, booking_number: 'ZU1400003', deleted_at: '2026-10-01T00:00:00Z' }],
    });

    const report = await importRows([row(2)]);

    expect(report.errors).toEqual([{ row: 2, message: expect.stringContaining('supprimé') }]);
    expect(store.containers).toHaveLength(0);
  });

  it('logs invalid rows with their Excel row number, creates nothing for them and keeps going', async () => {
    const store = createStore();

    const report = await importRows([
      row(2, { type: '45' }),
      row(3, { state: 'X', container_number: 'MSCU0000001' }),
      row(4, { date: '31/02/2026', container_number: 'MSCU0000002' }),
      row(5, { client: null, container_number: 'MSCU0000003' }),
      row(6, { container_number: 'MSCU7654321' }),
    ]);

    expect(report.errors).toEqual([
      { row: 2, message: expect.stringContaining('Type TC invalide') },
      { row: 3, message: expect.stringContaining('État invalide') },
      { row: 4, message: expect.stringContaining('Date invalide') },
      { row: 5, message: expect.stringContaining('Client manquant') },
    ]);
    expect(report.created.containers).toBe(1);
    expect(store.clients).toHaveLength(1);
  });

  it('keeps importing when a model throws unexpectedly', async () => {
    createStore();
    containerModel.create.mockRejectedValueOnce(new Error('connexion perdue'));

    const report = await importRows([row(2), row(3, { container_number: 'MSCU7654321' })]);

    expect(report.errors).toEqual([{ row: 2, message: 'connexion perdue' }]);
    expect(report.created.containers).toBe(1);
  });

  it('reports progress and logs each row', async () => {
    createStore();
    const onProgress = jest.fn();
    const log = jest.fn();

    await importRows([row(2), row(3, { type: '45' })], { onProgress, log });

    expect(onProgress).toHaveBeenLastCalledWith(2, 2);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^Ligne 2 : MSCU1234567 importé/));
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^Ligne 3 : ERREUR/));
  });
});

describe('extractRows', () => {
  // Reproduit le fichier réel : en-tête, ligne vide, données, puis d'autres
  // tableaux (fiches société, types de conteneurs...) sous une ligne vide.
  function buildSheet() {
    const ExcelJS = require('exceljs');
    const worksheet = new ExcelJS.Workbook().addWorksheet('BOOKING');
    worksheet.getRow(1).values = [null, 'DATE', 'HEURE', 'N°TC', 'MARCHANDISES', 'TYPE TC', 'N° BOOKING', 'COMPAGNIE', 'ETAT (P/V)', 'CLIENTS', 'CONTACT_TEL', 'IM_TRAC', 'IM_REMORQUE', 'IN'];
    worksheet.getRow(3).values = [null, '01/04/2026', '16H45', 'TCNU00035', 'DIVERS', '40FT', 'BK9900001', 'MAERSK', 'VIDE', 'CLIENT ALPHA', '699000115', 'TRTEST0018', 'RMTEST01A', 1];
    worksheet.getRow(4).values = [null, '02/04/2026', '16H46', 'TCNU00036', 'DIVERS', '20FT', 'BK9900002', 'MAERSK', 'VIDE', 'CLIENT ALPHA', '699000116', 'TRTEST0025', 'RMTEST01C', 1];
    worksheet.getRow(7).values = [null, '1.', 'CREATION DE LA SOCIETE'];
    worksheet.getRow(8).values = [null, null, null, 'RAISON SOCIALE : '];
    worksheet.getRow(10).values = [null, 'CT0001', '40FT', 'CONTENEUR DE 40 PIEDS'];
    return { worksheet, columns: mapHeaders(worksheet.getRow(1).values) };
  }

  it('stops at the first empty row after the data and counts what is ignored below', () => {
    const { worksheet, columns } = buildSheet();

    const { rows, endRow, ignoredBelow } = extractRows(worksheet, 1, columns);

    expect(rows.map((raw) => raw.excelRow)).toEqual([3, 4]);
    expect(rows[0]).toMatchObject({ container_number: 'TCNU00035', time: '16H45', in: 1 });
    expect(endRow).toBe(4);
    expect(ignoredBelow).toBe(3);
  });
});

describe('importRows en aperçu (dryRun)', () => {
  it('counts what would be created without writing anything', async () => {
    const store = createStore({ clients: [{ id: 62, code: 'CLI0062', name: 'AUTRE CLIENT' }] });
    const rows = [
      row(2),
      row(3, { container_number: 'MSCU7654321', in: 0 }),
      row(4), // même conteneur répété dans le fichier
    ];

    const report = await importRows(rows, { dryRun: true });

    expect(report.dryRun).toBe(true);
    expect(report.created).toEqual({ clients: 1, bookings: 1, tractors: 1, trailers: 1, containers: 2, movements: 1 });
    expect(report.skipped).toBe(1);
    expect(clientModel.create).not.toHaveBeenCalled();
    expect(bookingModel.create).not.toHaveBeenCalled();
    expect(vehicleModel.create).not.toHaveBeenCalled();
    expect(containerModel.create).not.toHaveBeenCalled();
    expect(containerModel.markAsProcessed).not.toHaveBeenCalled();
    expect(store.clients).toHaveLength(1);
  });

  it('gives the same counts as the real import', async () => {
    createStore();
    const rows = [row(2), row(3, { container_number: 'MSCU7654321', booking_number: 'ZU1400004' }), row(4, { type: '45' })];

    const preview = await importRows(rows, { dryRun: true });
    const real = await importRows(rows);

    expect(preview.created).toEqual(real.created);
    expect(preview.skipped).toBe(real.skipped);
    expect(preview.errors).toEqual(real.errors);
  });

  it('previews IN on an existing unprocessed container without marking it', async () => {
    const store = createStore();
    await importRows([row(2, { in: 0 })]);

    const report = await importRows([row(2, { in: 1 })], { dryRun: true });

    expect(report.created.movements).toBe(1);
    expect(store.containers[0].is_processed).toBe(false);
  });
});

describe('importRows — détail ligne par ligne', () => {
  it('lists each row with its status', async () => {
    createStore();
    await importRows([row(2, { in: 0 })]);

    const report = await importRows([
      row(2, { in: 1 }),
      row(3, { container_number: 'MSCU7654321', in: 0 }),
      row(4, { type: '45', container_number: 'MSCU0000001' }),
    ]);

    expect(report.rows).toEqual([
      { row: 2, status: 'existing', container_number: 'MSCU1234567', booking_number: 'ZU1400003', client: 'WOURI LOGISTICS', movement: true, message: null },
      { row: 3, status: 'new', container_number: 'MSCU7654321', booking_number: 'ZU1400003', client: 'WOURI LOGISTICS', movement: false, message: null },
      { row: 4, status: 'error', container_number: 'MSCU0000001', booking_number: 'ZU1400003', client: 'WOURI LOGISTICS', movement: false, message: expect.stringContaining('Type TC invalide') },
    ]);
  });
});

describe('readWorkbook', () => {
  async function buffer(build) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    build(workbook.addWorksheet('BOOKING'));
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  it('reads the booking table from an in-memory buffer', async () => {
    const file = await buffer((sheet) => {
      sheet.getRow(1).values = [null, 'SOBRO SARL'];
      sheet.getRow(3).values = [null, 'DATE', 'HEURE', 'N°TC', 'MARCHANDISES', 'TYPE TC', 'N° BOOKING', 'COMPAGNIE', 'ETAT (P/V)', 'CLIENTS', 'CONTACT_TEL', 'IM_TRAC', 'IM_REMORQUE', 'IN'];
      sheet.getRow(4).values = [null, '01/04/2026', '16H45', 'TCNU00035', 'DIVERS', '40FT', 'BK9900001', 'MAERSK', 'VIDE', 'CLIENT ALPHA', '699000115', 'TRTEST0018', 'RMTEST01A', 1];
    });

    const result = await readWorkbook(file);

    expect(result).toMatchObject({ sheetName: 'BOOKING', headerRow: 3, endRow: 4, ignoredBelow: 0 });
    expect(result.rows).toHaveLength(1);
  });

  it('rejects a file without the expected header (status 400)', async () => {
    const file = await buffer((sheet) => {
      sheet.getRow(1).values = [null, 'NOM', 'PRENOM'];
    });

    await expect(readWorkbook(file)).rejects.toMatchObject({ status: 400, message: expect.stringContaining('en-tête introuvable') });
  });

  it('rejects a file that is not a valid .xlsx (status 400)', async () => {
    await expect(readWorkbook(Buffer.from('pas un classeur'))).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('illisible'),
    });
  });
});

describe('importRows — recherches groupées', () => {
  it('looks up existing containers, bookings and vehicles in batch, not row by row', async () => {
    createStore();
    const rows = [row(2), row(3, { container_number: 'MSCU7654321', booking_number: 'ZU1400004', tractor: 'LT 999 ZZ' })];

    await importRows(rows, { dryRun: true });

    expect(containerModel.findByContainerNumbers).toHaveBeenCalledTimes(1);
    expect(containerModel.findByContainerNumbers).toHaveBeenCalledWith(['MSCU1234567', 'MSCU7654321']);
    expect(bookingModel.findByBookingNumbers).toHaveBeenCalledWith(['ZU1400003', 'ZU1400004']);
    expect(vehicleModel.findByPlateNumbers).toHaveBeenCalledWith(['LT123AB', 'LT456CD', 'LT999ZZ']);
    expect(containerModel.findByContainerNumber).not.toHaveBeenCalled();
    expect(bookingModel.findByBookingNumber).not.toHaveBeenCalled();
    expect(vehicleModel.findByPlateNumber).not.toHaveBeenCalled();
  });

  it('splits large lookups in chunks of 1000 keys', async () => {
    createStore();
    const rows = Array.from({ length: 1001 }, (_, i) =>
      row(i + 2, { container_number: `MSCU${String(i).padStart(7, '0')}` })
    );

    await importRows(rows, { dryRun: true });

    expect(containerModel.findByContainerNumbers).toHaveBeenCalledTimes(2);
    expect(containerModel.findByContainerNumbers.mock.calls[0][0]).toHaveLength(1000);
    expect(containerModel.findByContainerNumbers.mock.calls[1][0]).toHaveLength(1);
  });

  it('does not look up rows that failed validation', async () => {
    createStore();

    await importRows([row(2, { type: '45' })], { dryRun: true });

    expect(containerModel.findByContainerNumbers).toHaveBeenCalledWith([]);
  });
});

describe('importRows — téléphones client (2 maximum)', () => {
  const phones = (list) => list.map((phone, i) => row(i + 2, { container_number: `MSCU${String(i).padStart(7, '0')}`, phone }));

  it('gives a new client its first two distinct numbers', async () => {
    const store = createStore();

    const report = await importRows(phones(['699000115', '699 00 01 15', '699000116']));

    expect(store.clients[0]).toMatchObject({ phone: '699000115', phone_2: '699000116' });
    expect(report.warnings).toEqual([]);
  });

  it('keeps two numbers and warns about the others', async () => {
    const store = createStore();

    const report = await importRows(phones(['699000115', '699000116', '699000117', '699000118']));

    expect(store.clients[0]).toMatchObject({ phone: '699000115', phone_2: '699000116' });
    expect(report.warnings).toEqual([
      'Client "WOURI LOGISTICS" : 2 numéros maximum, 2 numéro(s) ignoré(s) (699000117, 699000118).',
    ]);
  });

  it('completes the empty phone slot of an existing client without overwriting', async () => {
    const store = createStore({ clients: [{ id: 5, code: 'CLI0005', name: 'WOURI LOGISTICS', phone: '699000115', phone_2: null }] });

    const report = await importRows(phones(['699 000 115', '699000116', '699000117']));

    expect(clientModel.update).toHaveBeenCalledWith(5, { phone_2: '699000116' });
    expect(store.clients[0]).toMatchObject({ phone: '699000115', phone_2: '699000116' });
    expect(report.updated.clients).toBe(1);
    expect(report.warnings).toEqual([
      'Client "WOURI LOGISTICS" : 2 numéros maximum, 1 numéro(s) ignoré(s) (699000117).',
    ]);
  });

  it('fills both slots of an existing client without phone', async () => {
    const store = createStore({ clients: [{ id: 5, code: 'CLI0005', name: 'WOURI LOGISTICS', phone: null, phone_2: null }] });

    await importRows(phones(['699000115', '699000116']));

    expect(clientModel.update).toHaveBeenCalledWith(5, { phone: '699000115', phone_2: '699000116' });
    expect(store.clients[0]).toMatchObject({ phone: '699000115', phone_2: '699000116' });
  });

  it('does not touch an existing client whose two slots are taken', async () => {
    createStore({ clients: [{ id: 5, code: 'CLI0005', name: 'WOURI LOGISTICS', phone: '1', phone_2: '2' }] });

    const report = await importRows(phones(['699000115']));

    expect(clientModel.update).not.toHaveBeenCalled();
    expect(report.updated.clients).toBe(0);
    expect(report.warnings).toEqual(['Client "WOURI LOGISTICS" : 2 numéros maximum, 1 numéro(s) ignoré(s) (699000115).']);
  });

  it('is idempotent: a second run updates nothing', async () => {
    createStore({ clients: [{ id: 5, code: 'CLI0005', name: 'WOURI LOGISTICS', phone: '699000115', phone_2: null }] });
    const rows = phones(['699000115', '699000116']);

    await importRows(rows);
    clientModel.update.mockClear();
    const second = await importRows(rows);

    expect(clientModel.update).not.toHaveBeenCalled();
    expect(second.updated.clients).toBe(0);
  });

  it('counts the update in preview without writing', async () => {
    const store = createStore({ clients: [{ id: 5, code: 'CLI0005', name: 'WOURI LOGISTICS', phone: '699000115', phone_2: null }] });

    const report = await importRows(phones(['699000116']), { dryRun: true });

    expect(report.updated.clients).toBe(1);
    expect(clientModel.update).not.toHaveBeenCalled();
    expect(store.clients[0].phone_2).toBeNull();
  });

  it('ignores phones of rows in error', async () => {
    const store = createStore();

    await importRows([row(2, { phone: '699000115' }), row(3, { phone: '699000199', type: '45', container_number: 'MSCU7654321' })]);

    expect(store.clients[0]).toMatchObject({ phone: '699000115', phone_2: null });
  });
});
