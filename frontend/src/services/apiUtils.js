export async function unwrapResponse(promise) {
  try {
    const { data } = await promise;
    return data.data;
  } catch (err) {
    const message = err.response?.data?.error || err.message || 'Une erreur est survenue.';
    const apiError = new Error(message);
    apiError.status = err.response?.status;
    apiError.data = err.response?.data;
    throw apiError;
  }
}
