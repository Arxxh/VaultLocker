import { performLogout } from '../logout';
import { setupSearch, renderCredentials } from '../modules/credentialList';
import { loadCredentials, initCredentialSync } from '../modules/credentialService';
import { bootstrapSession, loadProfile } from '../modules/session';
import { renderProfileDetails, updateUserInfo } from '../modules/profile';

export async function initView() {
  console.log('Dashboard view initialized');

  setupLogout();
  setupSearch();
  initCredentialSync();

  await hydrateAndRender();
}

const hydrateAndRender = async () => {
  const session = await bootstrapSession();
  if (session?.user) {
    updateUserInfo(session.user);
  }

  await loadProfile();
  renderProfileDetails();

  try {
    await loadCredentials();
  } catch (error) {
    console.error('No se pudieron cargar las credenciales en el dashboard clásico:', error);
    renderCredentials();
  }
};

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      performLogout();
    });
  }
}
