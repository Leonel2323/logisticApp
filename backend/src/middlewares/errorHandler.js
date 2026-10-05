const { failure } = require('../utils/apiResponse');
const { nodeEnv } = require('../config/env');

function notFoundHandler(req, res) {
  return failure(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const exposeDetail = nodeEnv !== 'production' || status < 500;
  const message = exposeDetail ? (err.message || 'Internal server error') : 'Internal server error';
  return failure(res, message, status);
}

module.exports = { notFoundHandler, errorHandler };
