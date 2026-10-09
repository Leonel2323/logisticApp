/**
 * Import Excel SOBRO : lecture du fichier, validation des lignes et création
 * idempotente des clients, bookings, véhicules, conteneurs et mouvements IN.
 *
 * Utilisé par le script CLI (scripts/importExcel.js) et par l'endpoint
 * POST /api/imports/excel. Chaque entité est recherchée par sa clé métier avant
 * création (nom client, n° booking, immatriculation, n° conteneur) : relancer
 * l'import sur le même fichier ne crée rien de plus.
 */
const ExcelJS = require('exceljs');
const clientModel = require('../models/clientModel');
const bookingModel = require('../models/bookingModel');
const vehicleModel = require('../models/vehicleModel');
const containerModel = require('../models/containerModel');
const clientValidation = require('../validations/clientValidation');
const bookingValidation = require('../validations/bookingValidation');
const vehicleValidation = require('../validations/vehicleValidation');
const containerValidation = require('../validations/containerValidation');

// Africa/Douala : UTC+1 toute l'année (pas d'heure d'été).
const DOUALA_OFFSET = '+01:00';
const PHONE_MAX_LENGTH = 20;
// Un client a au maximum 2 numéros (clients.phone et clients.phone_2).
const MAX_CLIENT_PHONES = 2;
const HEADER_SEARCH_ROWS = 20;

// En-têtes Excel normalisés (sans accents, espaces ni ponctuation) → champ.
const HEADER_ALIASES = {
  date: ['DATE'],
  time: ['HEURE'],
  container_number: ['NTC', 'TC', 'NCONTENEUR'],
  merchandise: ['MARCHANDISES', 'MARCHANDISE'],
  type: ['TYPETC', 'TYPE'],
  booking_number: ['NBOOKING', 'BOOKING'],
  shipping_company: ['COMPAGNIE'],
  state: ['ETATPV', 'ETAT'],
  client: ['CLIENTS', 'CLIENT'],
  phone: ['CONTACTTEL', 'CONTACT', 'TEL'],
  tractor: ['IMTRAC'],
  trailer: ['IMREMORQUE'],
  in: ['IN'],
};
const REQUIRED_FIELDS = ['date', 'container_number', 'type', 'booking_number', 'shipping_company', 'state', 'client'];

/** Erreur métier attendue sur une ligne (message affiché tel quel). */
class RowError extends Error {}

/** Fichier inexploitable dans son ensemble (status 400 côté API). */
class ImportFileError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

// ---------------------------------------------------------------------------
// Normalisation des cellules
// ---------------------------------------------------------------------------

function stripAccents(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Ramène une valeur de cellule exceljs (formule, texte riche, lien...) à une valeur simple. */
function cellValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('error' in value) return null;
    if ('result' in value) return cellValue(value.result);
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return cellValue(value.text);
    return null;
  }
  return value;
}

/** Trim + espaces multiples réduits ; chaîne vide → null. */
function cleanText(value) {
  if (value === null || value === undefined || value instanceof Date) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text || null;
}

/** Clé de comparaison des noms : insensible à la casse, aux accents et aux espaces. */
function nameKey(name) {
  const text = cleanText(name);
  return text ? stripAccents(text).toUpperCase() : null;
}

/** Clé de comparaison des téléphones : chiffres seuls ("699 00 01 15" = "699000115"). */
function phoneKey(phone) {
  return phone.replace(/\D/g, '') || phone.toUpperCase();
}

function headerKey(value) {
  const text = cleanText(cellValue(value));
  return text ? stripAccents(text).toUpperCase().replace(/[^A-Z0-9]/g, '') : null;
}

function normalizePlate(value) {
  const text = cleanText(value);
  return text ? text.toUpperCase().replace(/\s/g, '') : null;
}

function normalizeContainerNumber(value) {
  const text = cleanText(value);
  return text ? text.toUpperCase().replace(/[\s-]/g, '') : null;
}

function normalizeBookingNumber(value) {
  const text = cleanText(value);
  return text ? text.toUpperCase().replace(/\s/g, '') : null;
}

function pad(num, size = 2) {
  return String(num).padStart(size, '0');
}

function toIsoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? `${year}-${pad(month)}-${pad(day)}` : null;
}

/**
 * Accepte "2026-04-01 00:00:00", "2026-04-01", "01/04/2026" (JJ/MM/AAAA),
 * une date exceljs ou un numéro de série Excel. Renvoie "AAAA-MM-JJ" ou null.
 */
function parseDate(value) {
  if (value instanceof Date) {
    // exceljs stocke la date affichée à minuit UTC.
    return toIsoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === 'number') {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    return parseDate(date);
  }

  const text = cleanText(value);
  if (!text) return null;

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/);
  if (match) return toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return toIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));

  return null;
}

/** Accepte "08:30", "8h30", "14:05:00", une heure exceljs ou une fraction de jour. Renvoie "HH:MM" ou null. */
function parseTime(value) {
  let hours;
  let minutes;

  if (value instanceof Date) {
    hours = value.getUTCHours();
    minutes = value.getUTCMinutes();
  } else if (typeof value === 'number') {
    const total = Math.round((value % 1) * 24 * 60);
    hours = Math.floor(total / 60) % 24;
    minutes = total % 60;
  } else {
    const text = cleanText(value);
    const match = text && text.match(/^(\d{1,2})\s*[:hH]\s*(\d{2})?(?::\d{2})?$/);
    if (!match) return null;
    hours = Number(match[1]);
    minutes = Number(match[2] || 0);
  }

  if (hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}

/** "40", "40'HC", "20 ft", "10FT" → 40FT / 20FT / 10FT ; autre → null. */
function parseContainerType(value) {
  const text = cleanText(value);
  const match = text && text.toUpperCase().match(/^(10|20|40)(?!\d)/);
  return match ? `${match[1]}FT` : null;
}

/** P/PLEIN → PLEIN, V/VIDE → VIDE ; autre → null. */
function parseState(value) {
  const text = nameKey(value);
  if (text === 'P' || text === 'PLEIN') return 'PLEIN';
  if (text === 'V' || text === 'VIDE') return 'VIDE';
  return null;
}

/** 1 → true, 0 ou vide → false, autre → null (invalide). */
function parseIn(value) {
  if (value === true) return true;
  const text = cleanText(value);
  if (text === null || text === '0') return false;
  if (text === '1') return true;
  return null;
}

// ---------------------------------------------------------------------------
// Lecture du fichier
// ---------------------------------------------------------------------------

/**
 * Associe chaque champ à son numéro de colonne à partir des valeurs d'une
 * ligne d'en-tête exceljs (tableau indexé à partir de 1).
 * Renvoie null si une colonne obligatoire manque.
 */
function mapHeaders(headerValues) {
  const columns = {};
  headerValues.forEach((value, index) => {
    const key = headerKey(value);
    if (!key) return;
    const field = Object.keys(HEADER_ALIASES).find(
      (name) => columns[name] === undefined && HEADER_ALIASES[name].includes(key)
    );
    if (field) columns[field] = index;
  });

  return REQUIRED_FIELDS.every((field) => columns[field] !== undefined) ? columns : null;
}

/** Cherche la ligne d'en-tête dans les premières lignes de chaque feuille. */
function findHeader(workbook) {
  for (const worksheet of workbook.worksheets) {
    const last = Math.min(worksheet.rowCount, HEADER_SEARCH_ROWS);
    for (let rowNumber = 1; rowNumber <= last; rowNumber += 1) {
      const columns = mapHeaders(worksheet.getRow(rowNumber).values);
      if (columns) return { worksheet, headerRow: rowNumber, columns };
    }
  }
  return null;
}

/** Extrait les lignes de données (en-têtes, lignes vides et en-têtes répétés ignorés). */
function extractRows(worksheet, headerRow, columns) {
  const rows = [];
  let endRow = headerRow;
  let ignoredBelow = 0;

  for (let rowNumber = headerRow + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const excelRow = worksheet.getRow(rowNumber);
    const raw = { excelRow: rowNumber };
    Object.entries(columns).forEach(([field, col]) => {
      raw[field] = cellValue(excelRow.getCell(col).value);
    });

    const hasData = Object.keys(columns).some((field) => cleanText(raw[field]) !== null || raw[field] instanceof Date);
    const isRepeatedHeader = headerKey(raw.container_number) === 'NTC';

    if (rows.length > 0 && rowNumber > endRow + 1) {
      // Sous le tableau (après la première ligne vide) : autres tableaux de la feuille.
      if (hasData) ignoredBelow += 1;
    } else if (hasData && !isRepeatedHeader) {
      rows.push(raw);
      endRow = rowNumber;
    }
  }

  return { rows, endRow, ignoredBelow };
}

/**
 * Lit un classeur (Buffer ou chemin) et renvoie les lignes du tableau de
 * bookings. Lève une ImportFileError si le fichier est illisible ou si la
 * ligne d'en-tête est introuvable : rien n'est alors importé.
 */
async function readWorkbook(source) {
  const workbook = new ExcelJS.Workbook();
  try {
    if (Buffer.isBuffer(source)) await workbook.xlsx.load(source);
    else await workbook.xlsx.readFile(source);
  } catch {
    throw new ImportFileError('Fichier Excel illisible : vérifiez qu\'il s\'agit bien d\'un fichier .xlsx.');
  }

  const header = findHeader(workbook);
  if (!header) {
    const expected = REQUIRED_FIELDS.map((field) => HEADER_ALIASES[field][0]).join(', ');
    throw new ImportFileError(`Ligne d'en-tête introuvable (colonnes obligatoires : ${expected}).`);
  }

  const { rows, endRow, ignoredBelow } = extractRows(header.worksheet, header.headerRow, header.columns);
  return { sheetName: header.worksheet.name, headerRow: header.headerRow, endRow, ignoredBelow, rows };
}

// ---------------------------------------------------------------------------
// Préparation d'une ligne (aucune écriture en base)
// ---------------------------------------------------------------------------

function assertValid(schema, payload) {
  const { error } = schema.validate(payload, { abortEarly: false });
  if (error) throw new RowError(error.details.map((detail) => detail.message).join(', '));
}

/** Convertit et valide une ligne brute. Lève une RowError si elle est inexploitable. */
function parseRow(raw) {
  const date = parseDate(raw.date);
  if (!date) throw new RowError(`Date invalide ou manquante : "${cleanText(raw.date) ?? ''}".`);

  const time = parseTime(raw.time);
  if (!time && cleanText(raw.time) !== null) throw new RowError(`Heure invalide : "${cleanText(raw.time)}".`);

  const containerNumber = normalizeContainerNumber(raw.container_number);
  if (!containerNumber) throw new RowError('N° TC manquant.');

  const type = parseContainerType(raw.type);
  if (!type) throw new RowError(`Type TC invalide : "${cleanText(raw.type) ?? ''}" (attendu 40FT, 20FT ou 10FT).`);

  const state = parseState(raw.state);
  if (!state) throw new RowError(`État invalide : "${cleanText(raw.state) ?? ''}" (attendu P ou V).`);

  const bookingNumber = normalizeBookingNumber(raw.booking_number);
  if (!bookingNumber) throw new RowError('N° booking manquant.');

  const shippingCompany = cleanText(raw.shipping_company);
  if (!shippingCompany) throw new RowError('Compagnie manquante.');

  const clientName = cleanText(raw.client);
  if (!clientName) throw new RowError('Client manquant.');

  const isIn = parseIn(raw.in);
  if (isIn === null) throw new RowError(`Valeur IN invalide : "${cleanText(raw.in)}" (attendu 1 ou 0).`);

  const phone = cleanText(raw.phone);

  return {
    date,
    containerNumber,
    type,
    state,
    merchandise: cleanText(raw.merchandise),
    arrivalDatetime: `${date}T${time ?? '00:00'}:00${DOUALA_OFFSET}`,
    bookingNumber,
    shippingCompany,
    clientName,
    phone: phone ? phone.slice(0, PHONE_MAX_LENGTH) : null,
    tractorPlate: normalizePlate(raw.tractor),
    trailerPlate: normalizePlate(raw.trailer),
    isIn,
  };
}

// ---------------------------------------------------------------------------
// Résolution des entités (recherche par clé métier, sinon création)
// ---------------------------------------------------------------------------

/**
 * Écritures en base. En aperçu (dryRun), rien n'est écrit : les entités sont
 * simulées et mémorisées pour les lignes suivantes. Leurs id dépassent la plage
 * des colonnes integer PostgreSQL : valides pour Joi, jamais égaux à un vrai id.
 */
function createWriter(dryRun, existingContainers) {
  let simulatedId = 2 ** 31;
  // Conteneurs connus : préchargés, puis tenus à jour au fil des lignes.
  const containers = new Map(existingContainers);
  const simulate = (data) => ({ id: (simulatedId += 1), ...data });

  return {
    createClient: (data) => (dryRun ? simulate(data) : clientModel.create(data)),
    updateClient: (client, data) => (dryRun ? { ...client, ...data } : clientModel.update(client.id, data)),
    createBooking: (data) => (dryRun ? simulate({ deleted_at: null, ...data }) : bookingModel.create(data)),
    createVehicle: (data) => (dryRun ? simulate(data) : vehicleModel.create(data)),
    async findContainer(number) {
      return containers.get(number) ?? null;
    },
    async createContainer(data) {
      const container = dryRun ? simulate({ is_processed: false, ...data }) : await containerModel.create(data);
      containers.set(data.container_number, container);
      return container;
    },
    async markProcessed(container, options) {
      // En aperçu, on mémorise une copie « traitée » sans écrire.
      const processed = dryRun
        ? { ...container, is_processed: true }
        : await containerModel.markAsProcessed(container.id, options);
      containers.set(container.container_number, processed);
      return processed;
    },
  };
}

const LOOKUP_CHUNK_SIZE = 1000;

/** Recherche groupée par paquets (une requête par paquet) → Map clé → ligne. */
async function loadExisting(findMany, keys, keyField) {
  const found = new Map();
  for (let start = 0; start === 0 || start < keys.length; start += LOOKUP_CHUNK_SIZE) {
    const rows = await findMany(keys.slice(start, start + LOOKUP_CHUNK_SIZE));
    rows.forEach((row) => found.set(row[keyField], row));
  }
  return found;
}

/**
 * Numéros distincts de chaque client sur l'ensemble des lignes valides, dans
 * l'ordre du fichier (clé client → téléphones).
 */
function collectClientPhones(parsed) {
  const phonesByClient = new Map();
  parsed.forEach(({ data }) => {
    if (!data?.phone) return;
    const key = nameKey(data.clientName);
    const phones = phonesByClient.get(key) ?? [];
    if (!phones.some((phone) => phoneKey(phone) === phoneKey(data.phone))) phones.push(data.phone);
    phonesByClient.set(key, phones);
  });
  return phonesByClient;
}

/**
 * Précharge en quelques requêtes les conteneurs, bookings et véhicules du
 * fichier déjà présents en base, au lieu d'une requête par ligne (~150 ms
 * chacune sur Supabase).
 */
async function preloadExisting(validRows) {
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const [containers, bookings, vehicles] = await Promise.all([
    loadExisting(containerModel.findByContainerNumbers, unique(validRows.map((d) => d.containerNumber)), 'container_number'),
    loadExisting(bookingModel.findByBookingNumbers, unique(validRows.map((d) => d.bookingNumber)), 'booking_number'),
    loadExisting(
      vehicleModel.findByPlateNumbers,
      unique(validRows.flatMap((d) => [d.tractorPlate, d.trailerPlate])),
      'plate_number'
    ),
  ]);
  return { containers, bookings, vehicles };
}

function createResolvers(report, writer, existing, phonesByClient) {
  const clientsByKey = new Map();
  // Clients dont les téléphones ont déjà été traités pendant cet import.
  const phonesHandled = new Set();
  // Préchargés pour toutes les clés du fichier : une clé absente n'existe pas en base.
  const bookingsByNumber = new Map(existing.bookings);
  const vehiclesByPlate = new Map(existing.vehicles);
  let lastClientCode = 0;

  async function init() {
    const clients = await clientModel.findAll();
    clients
      .sort((a, b) => a.id - b.id)
      .forEach((client) => {
        const key = nameKey(client.name);
        if (key) clientsByKey.set(key, [...(clientsByKey.get(key) ?? []), client]);
        const match = /^CLI(\d+)$/.exec(client.code ?? '');
        if (match) lastClientCode = Math.max(lastClientCode, Number(match[1]));
      });

    // Noms identiques à la casse/aux accents/aux espaces près : on prend le plus ancien.
    clientsByKey.forEach((list, key) => {
      if (list.length > 1) {
        const ids = list.map((client) => `#${client.id}`).join(', ');
        report.warnings.push(`Clients en double pour "${key}" (${ids}) : le plus ancien (${ids.split(', ')[0]}) est utilisé.`);
      }
    });
  }

  function warnIgnoredPhones(name, ignored) {
    if (ignored.length === 0) return;
    report.warnings.push(
      `Client "${name}" : ${MAX_CLIENT_PHONES} numéros maximum, ${ignored.length} numéro(s) ignoré(s) (${ignored.join(', ')}).`
    );
  }

  /**
   * Complète les emplacements vides (phone, phone_2) d'un client existant avec
   * les numéros du fichier, sans jamais écraser un numéro déjà enregistré.
   */
  async function completePhones(existing, key) {
    const taken = [existing.phone, existing.phone_2].filter(Boolean).map(phoneKey);
    const candidates = (phonesByClient.get(key) ?? []).filter((phone) => !taken.includes(phoneKey(phone)));

    const changes = {};
    if (!existing.phone && candidates.length) changes.phone = candidates.shift();
    if (!existing.phone_2 && candidates.length) changes.phone_2 = candidates.shift();
    warnIgnoredPhones(existing.name, candidates);
    if (Object.keys(changes).length === 0) return existing;

    assertValid(clientValidation.update, changes);
    const updated = await writer.updateClient(existing, changes);
    report.updated.clients += 1;
    return updated;
  }

  async function client(name) {
    const key = nameKey(name);
    const known = clientsByKey.get(key);
    if (known && phonesHandled.has(key)) return known[0];

    const existing = known?.[0] ?? (await clientModel.findByName(name));
    if (existing) {
      const completed = await completePhones(existing, key);
      clientsByKey.set(key, [completed, ...(known?.slice(1) ?? [])]);
      phonesHandled.add(key);
      return completed;
    }

    const [phone = null, phone2 = null, ...ignored] = phonesByClient.get(key) ?? [];
    const payload = { code: `CLI${pad(lastClientCode + 1, 4)}`, name, phone, phone_2: phone2, type: 'client' };
    assertValid(clientValidation.create, payload);
    const created = await writer.createClient(payload);
    lastClientCode += 1;
    clientsByKey.set(key, [created]);
    phonesHandled.add(key);
    report.created.clients += 1;
    warnIgnoredPhones(name, ignored);
    return created;
  }

  /** Recherche seule (sans création) ; refuse un booking supprimé. */
  async function findBooking(number) {
    // Le préchargement inclut les bookings supprimés (le numéro reste unique).
    const found = bookingsByNumber.get(number) ?? null;
    if (found?.deleted_at) {
      throw new RowError(`Le booking "${number}" a été supprimé : restaurez-le ou retirez ses lignes de l'Excel.`);
    }
    return found;
  }

  async function booking(number, { shippingCompany, clientId, startDate }) {
    const existing = await findBooking(number);
    if (existing) return existing;

    const payload = { booking_number: number, shipping_company: shippingCompany, client_id: clientId, start_date: startDate };
    assertValid(bookingValidation.create, payload);
    const created = await writer.createBooking(payload);
    bookingsByNumber.set(number, created);
    report.created.bookings += 1;
    return created;
  }

  async function vehicle(plate, type) {
    if (!plate) return null;
    if (vehiclesByPlate.has(plate)) return vehiclesByPlate.get(plate);

    const payload = { plate_number: plate, type };
    assertValid(vehicleValidation.create, payload);
    const created = await writer.createVehicle(payload);
    vehiclesByPlate.set(plate, created);
    report.created[type === 'TRACTEUR' ? 'tractors' : 'trailers'] += 1;
    return created;
  }

  return { init, client, findBooking, booking, vehicle };
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * Importe les lignes brutes extraites du fichier. Une erreur sur une ligne est
 * consignée avec son numéro de ligne Excel et n'interrompt pas l'import.
 *
 * @param {Object[]} rows - Lignes brutes ({ excelRow, date, time, ... }).
 * @param {Object} [options]
 * @param {(line: string) => void} [options.log] - Journal ligne par ligne.
 * @param {(done: number, total: number) => void} [options.onProgress]
 * @param {boolean} [options.dryRun] - Aperçu : mêmes contrôles et mêmes
 *   compteurs (« serait créé »), mais aucune écriture en base.
 */
async function importRows(rows, { log = () => {}, onProgress = () => {}, dryRun = false } = {}) {
  const report = {
    dryRun,
    total: rows.length,
    created: { clients: 0, bookings: 0, tractors: 0, trailers: 0, containers: 0, movements: 0 },
    // Clients existants complétés (téléphones ajoutés dans un emplacement vide).
    updated: { clients: 0 },
    skipped: 0,
    warnings: [],
    errors: [],
    // Une entrée par ligne : status "new" (créé), "existing" (déjà présent) ou "error".
    rows: [],
  };

  // Validation de toutes les lignes avant écriture, et date de début de chaque
  // booking = date la plus ancienne vue pour lui dans le fichier.
  const parsed = rows.map((raw) => {
    try {
      return { raw, data: parseRow(raw) };
    } catch (err) {
      return { raw, error: err };
    }
  });
  const bookingStartDates = new Map();
  parsed.forEach(({ data }) => {
    if (!data) return;
    const current = bookingStartDates.get(data.bookingNumber);
    if (!current || data.date < current) bookingStartDates.set(data.bookingNumber, data.date);
  });

  const existing = await preloadExisting(parsed.filter(({ data }) => data).map(({ data }) => data));
  const writer = createWriter(dryRun, existing.containers);
  const resolve = createResolvers(report, writer, existing, collectClientPhones(parsed));
  await resolve.init();

  for (let index = 0; index < parsed.length; index += 1) {
    const { raw, data, error } = parsed[index];
    const prefix = `Ligne ${raw.excelRow} :`;

    try {
      if (error) throw error;

      // Un n° de conteneur déjà rattaché à un autre booking (ex. données de démo)
      // n'est ni réutilisé ni marqué traité : rien n'est écrit pour la ligne.
      const existingContainer = await writer.findContainer(data.containerNumber);
      if (existingContainer) {
        const rowBooking = await resolve.findBooking(data.bookingNumber);
        if (!rowBooking || rowBooking.id !== existingContainer.booking_id) {
          throw new RowError(
            `Le conteneur "${data.containerNumber}" existe déjà sur un autre booking (#${existingContainer.booking_id}) : ligne ignorée.`
          );
        }
      }

      const client = await resolve.client(data.clientName);
      const booking = await resolve.booking(data.bookingNumber, {
        shippingCompany: data.shippingCompany,
        clientId: client.id,
        startDate: bookingStartDates.get(data.bookingNumber),
      });
      const tractor = await resolve.vehicle(data.tractorPlate, 'TRACTEUR');
      await resolve.vehicle(data.trailerPlate, 'REMORQUE');

      let container = existingContainer;
      let action;
      if (container) {
        report.skipped += 1;
        action = 'déjà présent';
      } else {
        const payload = {
          container_number: data.containerNumber,
          type: data.type,
          state: data.state,
          merchandise: data.merchandise,
          booking_id: booking.id,
          client_id: client.id,
          arrival_datetime: data.arrivalDatetime,
        };
        assertValid(containerValidation.create, payload);
        container = await writer.createContainer(payload);
        report.created.containers += 1;
        action = 'importé';
      }

      // Rejouable : un conteneur déjà traité n'est pas re-marqué. Le mouvement IN
      // est daté de la ligne Excel (DATE + HEURE), pas du jour de l'import.
      if (data.isIn && !container.is_processed) {
        await writer.markProcessed(container, {
          vehicle_id: tractor?.id,
          processed_at: data.arrivalDatetime,
        });
        report.created.movements += 1;
        action += ' + mouvement IN';
      }

      report.rows.push({
        row: raw.excelRow,
        status: existingContainer ? 'existing' : 'new',
        container_number: data.containerNumber,
        booking_number: booking.booking_number,
        client: client.name,
        movement: action.endsWith('mouvement IN'),
        message: null,
      });
      log(`${prefix} ${data.containerNumber} ${action} (booking ${booking.booking_number}, client ${client.name})`);
    } catch (err) {
      const message = err.message || 'Erreur inconnue.';
      report.errors.push({ row: raw.excelRow, message });
      report.rows.push({
        row: raw.excelRow,
        status: 'error',
        container_number: data?.containerNumber ?? cleanText(raw.container_number),
        booking_number: data?.bookingNumber ?? cleanText(raw.booking_number),
        client: data?.clientName ?? cleanText(raw.client),
        movement: false,
        message,
      });
      log(`${prefix} ERREUR ${message}`);
    }

    onProgress(index + 1, parsed.length);
  }

  return report;
}


module.exports = {
  ImportFileError,
  cellValue,
  cleanText,
  nameKey,
  normalizePlate,
  normalizeContainerNumber,
  parseDate,
  parseTime,
  parseContainerType,
  parseState,
  parseIn,
  mapHeaders,
  extractRows,
  parseRow,
  readWorkbook,
  importRows,
};
