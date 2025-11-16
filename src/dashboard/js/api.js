export const API = 'http://localhost:3000'; // o tu backend real

export async function authFetch(url, options = {}) {
  const token = await new Promise((resolve) => {
    chrome.storage.local.get(['vault_token'], (res) => {
      resolve(res.vault_token || null);
    });
  });

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
