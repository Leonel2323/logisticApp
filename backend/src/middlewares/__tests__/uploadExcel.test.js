const express = require('express');
const { uploadExcel, MAX_FILE_SIZE } = require('../uploadExcel');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// Un .xlsx est une archive zip : il commence par la signature "PK\x03\x04".
const ZIP_BYTES = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(60)]);

let server;
let url;

beforeAll(async () => {
  const app = express();
  app.post('/upload', uploadExcel, (req, res) =>
    res.json({ success: true, data: { name: req.file.originalname, size: req.file.size }, error: null })
  );
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  url = `http://127.0.0.1:${server.address().port}/upload`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function send({ field = 'file', name = 'booking.xlsx', type = XLSX_MIME, content = ZIP_BYTES } = {}) {
  const form = new FormData();
  if (field) form.append(field, new Blob([content], { type }), name);
  const response = await fetch(url, { method: 'POST', body: form });
  return { status: response.status, body: await response.json() };
}

describe('uploadExcel', () => {
  it('accepts a .xlsx file and keeps it in memory', async () => {
    const { status, body } = await send();

    expect(status).toBe(200);
    expect(body.data).toEqual({ name: 'booking.xlsx', size: ZIP_BYTES.length });
  });

  it('accepts the generic binary type some browsers send', async () => {
    const { status } = await send({ type: 'application/octet-stream' });

    expect(status).toBe(200);
  });

  it('rejects a request without file', async () => {
    const { status, body } = await send({ field: null });

    expect(status).toBe(400);
    expect(body.error).toBe('Aucun fichier reçu : joignez un fichier .xlsx dans le champ « file ».');
  });

  it('rejects another extension', async () => {
    const { status, body } = await send({ name: 'booking.csv', type: 'text/csv' });

    expect(status).toBe(400);
    expect(body.error).toBe('Seuls les fichiers Excel .xlsx sont acceptés.');
  });

  it('rejects a .xlsx name whose content is not a zip archive', async () => {
    const { status, body } = await send({ content: Buffer.from('DATE;HEURE;N°TC') });

    expect(status).toBe(400);
    expect(body.error).toBe("Le fichier n'est pas un classeur .xlsx valide.");
  });

  it('rejects a file larger than the limit', async () => {
    const tooBig = Buffer.concat([ZIP_BYTES, Buffer.alloc(MAX_FILE_SIZE)]);

    const { status, body } = await send({ content: tooBig });

    expect(status).toBe(400);
    expect(body.error).toBe('Fichier trop volumineux (5 Mo maximum).');
  });

  it('rejects a file sent under another field name', async () => {
    const { status, body } = await send({ field: 'document' });

    expect(status).toBe(400);
    expect(body.error).toBe('Envoyez un seul fichier .xlsx dans le champ « file ».');
  });
});
