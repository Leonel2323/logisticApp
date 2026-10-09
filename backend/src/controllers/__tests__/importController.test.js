jest.mock('../../services/excelImportService', () => ({
  readWorkbook: jest.fn(),
  importRows: jest.fn(),
}));

const { readWorkbook, importRows } = require('../../services/excelImportService');
const { excel, MAX_IMPORT_ROWS } = require('../importController');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
}

function mockReq(mode = 'preview') {
  return {
    query: { mode },
    user: { id: 1, role: 'admin' },
    file: { originalname: 'GESTION DES BOOKING.xlsx', buffer: Buffer.from('xlsx') },
  };
}

const WORKBOOK = { sheetName: 'BOOKING', headerRow: 15, endRow: 31, ignoredBelow: 48, rows: [{ excelRow: 17 }] };
const REPORT = { dryRun: true, total: 1, created: {}, skipped: 0, warnings: [], errors: [], rows: [] };

afterEach(() => {
  jest.clearAllMocks();
});

describe('excel', () => {
  it('previews the import without writing (mode preview)', async () => {
    readWorkbook.mockResolvedValue(WORKBOOK);
    importRows.mockResolvedValue(REPORT);
    const req = mockReq('preview');
    const res = mockRes();

    await excel(req, res, jest.fn());

    expect(readWorkbook).toHaveBeenCalledWith(req.file.buffer);
    expect(importRows).toHaveBeenCalledWith(WORKBOOK.rows, { dryRun: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        file: { name: 'GESTION DES BOOKING.xlsx', sheetName: 'BOOKING', headerRow: 15, endRow: 31, ignoredBelow: 48 },
        report: REPORT,
      },
      error: null,
    });
  });

  it('writes to the database in commit mode', async () => {
    readWorkbook.mockResolvedValue(WORKBOOK);
    importRows.mockResolvedValue({ ...REPORT, dryRun: false });

    await excel(mockReq('commit'), mockRes(), jest.fn());

    expect(importRows).toHaveBeenCalledWith(WORKBOOK.rows, { dryRun: false });
  });

  it('refuses a second commit while one is running (409)', async () => {
    readWorkbook.mockResolvedValue(WORKBOOK);
    let finishFirst;
    importRows.mockReturnValueOnce(new Promise((resolve) => { finishFirst = resolve; }));

    const first = excel(mockReq('commit'), mockRes(), jest.fn());
    await new Promise(setImmediate);
    const res = mockRes();
    await excel(mockReq('commit'), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Un import est déjà en cours. Réessayez dans quelques instants.' })
    );

    finishFirst(REPORT);
    await first;

    // Le verrou est libéré une fois le premier import terminé.
    importRows.mockResolvedValue(REPORT);
    const after = mockRes();
    await excel(mockReq('commit'), after, jest.fn());
    expect(after.status).toHaveBeenCalledWith(200);
  });

  it('allows previews while a commit is running', async () => {
    readWorkbook.mockResolvedValue(WORKBOOK);
    let finishCommit;
    importRows.mockReturnValueOnce(new Promise((resolve) => { finishCommit = resolve; }));
    const commit = excel(mockReq('commit'), mockRes(), jest.fn());
    await new Promise(setImmediate);

    importRows.mockResolvedValueOnce(REPORT);
    const res = mockRes();
    await excel(mockReq('preview'), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    finishCommit(REPORT);
    await commit;
  });

  it('rejects a file with no data row (400)', async () => {
    readWorkbook.mockResolvedValue({ ...WORKBOOK, rows: [] });
    const res = mockRes();

    await excel(mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Aucune ligne de données sous l'en-tête." }));
    expect(importRows).not.toHaveBeenCalled();
  });

  it('rejects a file with too many rows (400)', async () => {
    readWorkbook.mockResolvedValue({ ...WORKBOOK, rows: new Array(MAX_IMPORT_ROWS + 1).fill({}) });
    const res = mockRes();

    await excel(mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: `Trop de lignes (${MAX_IMPORT_ROWS + 1}) : ${MAX_IMPORT_ROWS} maximum par import depuis l'application. Découpez le fichier ou utilisez le script npm run import:excel.`,
      })
    );
    expect(importRows).not.toHaveBeenCalled();
  });

  it('keeps the web limit low enough to finish before the HTTP timeout', () => {
    // ~1,8 s par ligne nouvelle (Supabase) : 100 lignes ≈ 3 min < 5 min (requestTimeout Node).
    expect(MAX_IMPORT_ROWS).toBe(100);
  });

  it('forwards file errors to the error handler and releases the lock', async () => {
    const fileError = Object.assign(new Error("Ligne d'en-tête introuvable."), { status: 400 });
    readWorkbook.mockRejectedValueOnce(fileError);
    const next = jest.fn();

    await excel(mockReq('commit'), mockRes(), next);

    expect(next).toHaveBeenCalledWith(fileError);

    readWorkbook.mockResolvedValue(WORKBOOK);
    importRows.mockResolvedValue(REPORT);
    const res = mockRes();
    await excel(mockReq('commit'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
