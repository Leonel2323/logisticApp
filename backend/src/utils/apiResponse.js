function success(res, data = null, status = 200) {
  if (status === 204) {
    return res.status(204).end();
  }
  return res.status(status).json({ success: true, data, error: null });
}

function failure(res, error = 'Internal server error', status = 500) {
  return res.status(status).json({ success: false, data: null, error });
}

module.exports = { success, failure };
