const { verifyToken } = require('../services/authService');
const { failure } = require('../utils/apiResponse');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return failure(res, "En-tête Authorization manquant ou invalide.", 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return failure(res, 'Token invalide ou expiré.', 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return failure(res, 'Accès refusé : permissions insuffisantes.', 403);
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
