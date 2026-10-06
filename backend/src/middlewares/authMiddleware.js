const { verifyToken } = require('../utils/jwt');
const { failure } = require('../utils/apiResponse');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return failure(res, 'Missing or malformed Authorization header', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return failure(res, 'Invalid or expired token', 401);
  }
}

module.exports = authMiddleware;
