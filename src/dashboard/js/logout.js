import { api } from '../../utils/api';
import { clearStoredSession } from './authStorage';

export { clearStoredSession };

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
