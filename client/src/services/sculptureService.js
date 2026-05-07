import { BASE_URL, apiFetch } from './api';

export function getSculptures() {
  return apiFetch(`${BASE_URL}/sculptures`);
}

export function createSculpture(data) {
  return apiFetch(`${BASE_URL}/sculptures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteSculpture(id) {
  return apiFetch(`${BASE_URL}/sculptures/${id}`, { method: 'DELETE' });
}
