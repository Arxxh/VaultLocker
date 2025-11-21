import { performLogout } from './logout';
import { initDebugTools } from './modules/debug';
import { deleteCredential, loadCredentials } from './modules/credentialService';
import { setupModal } from './modules/credentialModal';
import { renderProfileDetails, updateUserInfo } from './modules/profile';
import { bootstrapSession, loadProfile } from './modules/session';
import { setupSearch } from './modules/credentialList';
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

  await loadProfile();
  renderProfileDetails();
  await loadCredentials();
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
