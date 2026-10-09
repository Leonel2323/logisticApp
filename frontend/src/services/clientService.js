import api from './api';
import { unwrapResponse } from './apiUtils';

export function getClients() {
  return unwrapResponse(api.get('/clients'));
}
