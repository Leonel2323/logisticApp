import api from './api';
import { unwrapResponse } from './apiUtils';

function postExcel(file, mode) {
  const form = new FormData();
  form.append('file', file);
  return unwrapResponse(api.post('/imports/excel', form, { params: { mode } }));
}

/** Analyse le fichier sans rien enregistrer. */
export function previewExcelImport(file) {
  return postExcel(file, 'preview');
}

/** Importe réellement le fichier. */
export function commitExcelImport(file) {
  return postExcel(file, 'commit');
}
