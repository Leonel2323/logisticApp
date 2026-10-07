import api from './api';

export function login(email, password) {
  return api.post('/auth/login', { email, password });
}

export function register(payload) {
  return api.post('/auth/register', payload);
}

export function me() {
  return api.get('/auth/me');
}

export function logout() {
  return api.post('/auth/logout');
}
