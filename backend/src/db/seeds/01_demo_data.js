// Seed reproductible : PRNG déterministe (pas de dépendance externe type faker).
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20261010);

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}
function int(min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
function pad(num, size) {
  return String(num).padStart(size, '0');
}
function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}
function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

const NOW = new Date('2026-10-06T00:00:00Z');

const FIRST_NAMES = [
  'Jean', 'Paul', 'Pierre', 'Emmanuel', 'Joseph', 'Samuel', 'Daniel', 'Michel',
  'André', 'Bernard', 'Christian', 'Eric', 'Serge', 'Vincent', 'Hervé', 'Marcel',
  'Blaise', 'Félix', 'Robert', 'Thierry', 'Marie', 'Brigitte', 'Pauline', 'Sandrine',
  'Chantal', 'Aminatou', 'Fatimatou', 'Delphine', 'Colette', 'Yvonne', 'Honorine',
  'Ariane', 'Carine', 'Larissa', 'Nadège', 'Solange', 'Clarisse', 'Odette', 'Justine',
  'Abdoulaye', 'Oumarou', 'Issa', 'Moussa',
];

const LAST_NAMES = [
  'Mbarga', 'Ngono', 'Fotso', 'Kamga', 'Nkomo', 'Ewane', 'Essomba', 'Biya',
  'Tchoupo', 'Njoya', 'Talla', 'Wandji', 'Mbida', 'Ndongo', 'Eto\'o', 'Abega',
  'Moukoko', 'Dibango', 'Tabe', 'Ekotto', 'Beyala', 'Nganou', 'Fouda', 'Mvondo',
  'Kenfack', 'Nana', 'Zang', 'Owona', 'Bello', 'Oumarou', 'Hamadou', 'Yaya',
  'Ateba', 'Sende', 'Manga', 'Bisseck',
];

const REGIONS_CITIES = [
  ['Littoral', 'Douala'], ['Littoral', 'Douala'], ['Littoral', 'Douala'],
  ['Centre', 'Yaoundé'], ['Ouest', 'Bafoussam'], ['Nord-Ouest', 'Bamenda'],
  ['Nord', 'Garoua'], ['Extrême-Nord', 'Maroua'], ['Adamaoua', 'Ngaoundéré'],
  ['Est', 'Bertoua'], ['Sud', 'Ebolowa'], ['Sud', 'Kribi'],
  ['Sud-Ouest', 'Limbe'], ['Sud-Ouest', 'Buea'], ['Littoral', 'Edéa'],
];
const DOUALA_STREETS = [
  'Rue Joss', 'Avenue de la Liberté', 'Boulevard de la République',
  'Rue Ivy', 'Avenue du Port', 'Rue Franceville', 'Boulevard des Nations-Unies',
];

const CLIENT_TYPES = ['client', 'fournisseur', 'salarie'];
const COMPANY_NAMES = [
  'PULLMAN', 'SOCATUR', 'SONARA', 'ALUCAM', 'CIMENCAM', 'BOCOM TRANSIT',
  'CAMRAIL FREIGHT', 'SAGA CAMEROUN', 'BOLLORE TRANSPORT', 'NEPTUNE TRANSIT',
  'DOUALA FRET SERVICES', 'WOURI LOGISTICS', 'LITTORAL NEGOCE', 'SANAGA TRADING',
  'MUNGO IMPORT EXPORT', 'ESTUAIRE CARGO', 'AKWA SHIPPING AGENCY',
  'BONABERI CONSIGNATION', 'CAMEROUN AGRO INDUSTRIES', 'GOLFE DE GUINEE SARL',
];

const SHIPPING_COMPANIES = [
  'MAERSK', 'MSC', 'CMA CGM', 'COSCO', 'HAPAG-LLOYD', 'ONE', 'EVERGREEN',
  'HYUNDAI MERCHANT MARINE', 'YANG MING', 'PIL',
];
const BOOKING_STATUSES = ['en_cours', 'cloture', 'retard'];

const CONTAINER_TYPES = ['40FT', '20FT', '10FT'];
const MERCHANDISE = [
  'Cacao', 'Café', 'Bois sciés', 'Coton', 'Bananes plantain', 'Caoutchouc',
  'Huile de palme', 'Ciment', 'Riz importé', 'Pièces détachées automobiles',
  'Matériel électronique', 'Produits pharmaceutiques', 'Textile', 'Engrais',
  'Sucre', 'Blé', 'Matériaux de construction', 'Véhicules importés',
];

const VEHICLE_TYPES = ['TRACTEUR', 'REMORQUE', 'CAMION'];
const VEHICLE_STATUSES = ['disponible', 'en_mission', 'maintenance'];
const PERMIT_CATEGORIES = ['B', 'C', 'D', 'E'];

function randomPhone() {
  return `+237 6${pad(int(0, 99999999), 8)}`;
}

function buildClientCode(i) {
  return `CLI${pad(i, 4)}`;
}

function buildBookingNumber(i) {
  const prefix = pick(['ZU', 'MX', 'DK', 'LT', 'BK']);
  return `${prefix}${pad(1400000 + i, 7)}`;
}

function buildContainerNumber(i) {
  const letters = pick(['ZKUM', 'MSCU', 'MAEU', 'CMAU', 'HLXU', 'COSU', 'OOLU']);
  return `${letters}${pad(i, 5)}`;
}

function buildPlateNumber(i) {
  const typeAbbrev = pick(['TR', 'RM', 'CM']);
  const region = pick(['SRLT', 'SRCE', 'SROU', 'SRNO', 'SRSW']);
  return `${typeAbbrev}${region}${pad(i, 4)}`;
}

exports.seed = async function (knex) {
  await knex.transaction(async (trx) => {
    await trx('containers').del();
    await trx('bookings').del();
    await trx('vehicles').del();
    await trx('clients').del();
    await trx('drivers').del();

    const drivers = [];
    for (let i = 1; i <= 30; i += 1) {
      const createdAt = addDays(new Date('2025-02-15T00:00:00Z'), int(0, 300));
      const hasPermit = rng() < 0.9;
      drivers.push({
        first_name: pick(FIRST_NAMES),
        last_name: pick(LAST_NAMES),
        phone: randomPhone(),
        email: null,
        permit_number: hasPermit ? `CM-PL-${pad(i, 6)}` : null,
        permit_category: hasPermit ? pick(PERMIT_CATEGORIES) : null,
        permit_expiry: hasPermit ? toDateOnly(addDays(NOW, int(30, 1000))) : null,
        created_at: createdAt,
      });
    }
    const driverIds = await trx.batchInsert('drivers', drivers, 30).returning('id');

    const vehicles = [];
    for (let i = 1; i <= 20; i += 1) {
      const createdAt = addDays(new Date('2025-02-01T00:00:00Z'), int(0, 300));
      vehicles.push({
        plate_number: buildPlateNumber(i),
        type: pick(VEHICLE_TYPES),
        driver_id: driverIds[i - 1].id,
        status: pick(VEHICLE_STATUSES),
        created_at: createdAt,
      });
    }
    await trx.batchInsert('vehicles', vehicles, 20);

    const clients = [];
    for (let i = 1; i <= 50; i += 1) {
      const createdAt = addDays(new Date('2025-04-01T00:00:00Z'), int(0, 500));
      const [region, city] = pick(REGIONS_CITIES);
      clients.push({
        code: buildClientCode(i),
        name: `${pick(COMPANY_NAMES)} ${i}`,
        type: pick(CLIENT_TYPES),
        phone: randomPhone(),
        email: `contact${i}@entreprise-cm${i}.cm`,
        country: 'Cameroun',
        region,
        city,
        street: city === 'Douala' ? pick(DOUALA_STREETS) : `Avenue Centrale, ${city}`,
        created_at: createdAt,
      });
    }
    const clientIds = await trx.batchInsert('clients', clients, 50).returning('id');

    const bookings = [];
    for (let i = 1; i <= 100; i += 1) {
      const clientIdx = int(0, clientIds.length - 1);
      const clientRow = clientIds[clientIdx];
      const client = clients[clientIdx];
      const startDate = addDays(client.created_at, int(1, 400));
      const cappedStart = startDate.getTime() > NOW.getTime() ? NOW : startDate;
      const status = pick(BOOKING_STATUSES);
      const hasEndDate = status !== 'en_cours';
      const endDate = hasEndDate ? addDays(cappedStart, int(5, 45)) : null;

      bookings.push({
        booking_number: buildBookingNumber(i),
        shipping_company: pick(SHIPPING_COMPANIES),
        client_id: clientRow.id,
        start_date: toDateOnly(cappedStart),
        end_date: endDate ? toDateOnly(endDate) : null,
        status,
        created_at: cappedStart,
        _client_id: clientRow.id,
        _start_date: cappedStart,
        _end_date: endDate,
      });
    }
    const bookingRows = bookings.map(({ _client_id, _start_date, _end_date, ...rest }) => rest);
    const bookingIds = await trx.batchInsert('bookings', bookingRows, 50).returning('id');
    bookings.forEach((b, idx) => {
      b.id = bookingIds[idx].id;
    });

    const containers = [];
    for (let i = 1; i <= 500; i += 1) {
      const booking = pick(bookings);
      const isFull = rng() < 0.8;
      const arrival = addDays(booking._start_date, int(0, 10));
      const cappedArrival = arrival.getTime() > NOW.getTime() ? NOW : arrival;
      const hasDeparted = rng() < 0.6
        && (!booking._end_date || cappedArrival.getTime() <= booking._end_date.getTime());
      const departure = hasDeparted ? addDays(cappedArrival, int(1, 20)) : null;
      const cappedDeparture = departure && departure.getTime() > NOW.getTime() ? null : departure;

      containers.push({
        container_number: buildContainerNumber(i),
        type: pick(CONTAINER_TYPES),
        state: isFull ? 'PLEIN' : 'VIDE',
        merchandise: isFull ? pick(MERCHANDISE) : null,
        booking_id: booking.id,
        client_id: booking._client_id,
        is_processed: Boolean(cappedDeparture),
        arrival_datetime: cappedArrival,
        departure_datetime: cappedDeparture,
        created_at: cappedArrival,
      });
    }
    await trx.batchInsert('containers', containers, 100);
  });
};
