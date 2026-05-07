import { BASE_URL, apiFetch } from './api';

export function getCart() {
  return apiFetch(`${BASE_URL}/cart`);
}

export function addToCart(sculptureId, materialId) {
  return apiFetch(`${BASE_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sculptureId, materialId }),
  });
}

export function removeFromCart(itemId) {
  return apiFetch(`${BASE_URL}/cart/${itemId}`, { method: 'DELETE' });
}
