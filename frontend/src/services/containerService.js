import api from './api';
import { unwrapResponse } from './apiUtils';

export function getContainers(filters = {}) {
  return unwrapResponse(api.get('/containers', { params: filters }));
}

export function getContainerById(id) {
  return unwrapResponse(api.get(`/containers/${id}`));
}

export function createContainer(data) {
  return unwrapResponse(api.post('/containers', data));
}

export function updateContainer(id, data) {
  return unwrapResponse(api.put(`/containers/${id}`, data));
}

export function deleteContainer(id) {
  return unwrapResponse(api.delete(`/containers/${id}`));
}

export function markContainerProcessed(id, data = {}) {
  return unwrapResponse(api.post(`/containers/${id}/mark-processed`, data));
}

export function getContainerMovements(id) {
  return unwrapResponse(api.get(`/containers/${id}/movements`));
}

export function getContainerStatsByBooking(bookingId) {
  return unwrapResponse(api.get(`/containers/stats/${bookingId}`));
}
