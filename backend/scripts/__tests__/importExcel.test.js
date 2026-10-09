jest.mock('../../src/config/db', () => ({ destroy: jest.fn() }));
jest.mock('../../src/services/excelImportService', () => ({ readWorkbook: jest.fn(), importRows: jest.fn() }));

const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolveFilePath } = require('../importExcel');

describe('resolveFilePath', () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sobro-import-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('fails when the given file does not exist', () => {
    expect(() => resolveFilePath(path.join(dir, 'absent.xlsx'), dir)).toThrow('introuvable');
  });

  it('fails when the data folder has no .xlsx file', () => {
    expect(() => resolveFilePath(undefined, dir)).toThrow('Aucun fichier .xlsx');
  });

  it('fails when the data folder has several .xlsx files', () => {
    fs.writeFileSync(path.join(dir, 'a.xlsx'), '');
    fs.writeFileSync(path.join(dir, 'b.xlsx'), '');

    expect(() => resolveFilePath(undefined, dir)).toThrow('Plusieurs fichiers');
  });

  it('picks the single .xlsx file and ignores Excel lock files', () => {
    fs.writeFileSync(path.join(dir, 'sobro.xlsx'), '');
    fs.writeFileSync(path.join(dir, '~$sobro.xlsx'), '');

    expect(resolveFilePath(undefined, dir)).toBe(path.join(dir, 'sobro.xlsx'));
  });
});
