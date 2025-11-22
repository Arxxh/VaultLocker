import { performLogout } from './logout';
import { initDebugTools } from './modules/debug';
import { deleteCredential, initCredentialSync, loadCredentials } from './modules/credentialService';
import { setupModal } from './modules/credentialModal';
import { renderProfileDetails, updateUserInfo } from './modules/profile';
import { bootstrapSession, loadProfile } from './modules/session';
import { setupSearch, renderCredentials } from './modules/credentialList';
import { isInitialized, markInitialized } from './modules/state';

const setupLogout = () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', performLogout);
  }
};

const bootstrapDashboard = async () => {
  if (isInitialized()) return;
  markInitialized();

  const session = await bootstrapSession();
  if (!session) return;

  updateUserInfo(session.user);
  setupLogout();
  setupModal(deleteCredential);
  setupSearch();
  initDebugTools();
  initCredentialSync();

  await loadProfile();
  renderProfileDetails();

  // Asegura que el listado se pinte incluso si algo falla en la carga.
  try {
    await loadCredentials();
  } catch (error) {
    console.error('No se pudieron cargar credenciales en app view:', error);
  }

  // Refresco final del listado con la caché actual.
  renderCredentials();
};

export const initializeCredentialsView = () => {
  setupSearch();
  loadCredentials();
};

export const onCredentialsViewLoaded = () => {
  initializeCredentialsView();
};

export const bootstrapAppPage = () => {
  bootstrapDashboard();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAppPage);
} else {
  bootstrapAppPage();
}
