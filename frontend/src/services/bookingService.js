import api from './api';
import { unwrapResponse } from './apiUtils';

export function getBookings(filters = {}) {
  return unwrapResponse(api.get('/bookings', { params: filters }));
}

export function getBookingById(id) {
  return unwrapResponse(api.get(`/bookings/${id}`));
}

export function createBooking(data) {
  return unwrapResponse(api.post('/bookings', data));
}

export function updateBooking(id, data) {
  return unwrapResponse(api.put(`/bookings/${id}`, data));
}

export function deleteBooking(id) {
  return unwrapResponse(api.delete(`/bookings/${id}`));
}

export function getBookingStats(id) {
  return unwrapResponse(api.get(`/bookings/${id}/stats`));
}

export function getShippingCompanies() {
  return unwrapResponse(api.get('/bookings/shipping-companies'));
}
