const multer = require('multer');
const { failure } = require('../utils/apiResponse');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const XLSX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Certains navigateurs envoient un type générique pour les .xlsx.
  'application/octet-stream',
];
// Un .xlsx est une archive zip : on vérifie la signature, pas seulement le nom.
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

class UploadError extends Error {}

function fileFilter(req, file, callback) {
  const validName = /\.xlsx$/i.test(file.originalname);
  const validType = XLSX_MIME_TYPES.includes(file.mimetype);
  if (!validName || !validType) {
    return callback(new UploadError('Seuls les fichiers Excel .xlsx sont acceptés.'));
  }
  return callback(null, true);
}

// Fichier gardé en mémoire uniquement : jamais écrit sur le disque du serveur.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
}).single('file');

function uploadErrorMessage(err) {
  if (err instanceof UploadError) return err.message;
  if (err.code === 'LIMIT_FILE_SIZE') return `Fichier trop volumineux (${MAX_FILE_SIZE / 1024 / 1024} Mo maximum).`;
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return 'Envoyez un seul fichier .xlsx dans le champ « file ».';
  }
  return "Envoi du fichier invalide.";
}

/** Reçoit un unique fichier .xlsx dans le champ multipart "file" (req.file.buffer). */
function uploadExcel(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof UploadError || err instanceof multer.MulterError) {
      return failure(res, uploadErrorMessage(err), 400);
    }
    if (err) return next(err);

    if (!req.file) {
      return failure(res, 'Aucun fichier reçu : joignez un fichier .xlsx dans le champ « file ».', 400);
    }
    if (!req.file.buffer.subarray(0, ZIP_SIGNATURE.length).equals(ZIP_SIGNATURE)) {
      return failure(res, "Le fichier n'est pas un classeur .xlsx valide.", 400);
    }
    return next();
  });
}

module.exports = { uploadExcel, MAX_FILE_SIZE };
