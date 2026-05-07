import { BASE_URL, apiFetch } from './api';

export function saveModel(buffer) {
  return apiFetch(`${BASE_URL}/model/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });
}
