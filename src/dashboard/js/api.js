export const API = 'http://localhost:3000'; // tu NestJS backend

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('vault_token');
  if (!token) return null;

  return fetch(API + url, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}
