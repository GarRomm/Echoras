import { BASE_URL, apiFetch } from './api';

export function triggerRender(id, options) {
  return apiFetch(`${BASE_URL}/render/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
}
