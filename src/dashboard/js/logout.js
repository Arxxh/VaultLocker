import { api } from '../../utils/api';

async function clearStoredSession() {
  localStorage.removeItem('vault_token');
  localStorage.removeItem('vault_user');

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.remove(['vault_token', 'vault_user']);
  }
}

export async function performLogout() {
  try {
    await api.logout();
  } catch (error) {
    console.error('Error al cerrar sesión en el backend:', error);
  } finally {
    await clearStoredSession();
    window.location.hash = '/login';
  }
}
