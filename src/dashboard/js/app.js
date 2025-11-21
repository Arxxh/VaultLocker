import { performLogout } from './logout';
import { getSessionOrRedirect, getStoredSession, hydrateSessionFromExtensionStorage } from './authStorage';
import { api } from '../../utils/api';
import { decryptData } from '../../utils/crypto';

let cachedCredentials = [];
let initialized = false;
let currentSession = null;
let currentProfile = null;
let selectedCredential = null;
let modalUnlocked = false;

function resolveActiveUserId() {
  const session = currentSession ?? getStoredSession();
  const user = session?.user;

  if (!user) return null;

  const candidate = user.id || user._id || user.uid || user.email;
  return candidate ? String(candidate) : null;
}

function updateUserInfo(user) {
  if (!user) return;

  try {
    const userNameElement = document.getElementById('user-display-name');
    if (userNameElement) {
      userNameElement.textContent = user.email.split('@')[0];
    }

    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
      const initials = user.email.substring(0, 2).toUpperCase();
      avatarElement.textContent = initials;
    }
  } catch (error) {
    console.error('Error actualizando información del usuario:', error);
  }
}

function renderProfileDetails() {
  const email = currentProfile?.email || currentSession?.user?.email;

  if (email) {
    const userEmail = document.getElementById('user-email');
    if (userEmail) userEmail.textContent = email;

    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) profileEmail.textContent = email;
  }

  const createdAt = currentProfile?.createdAt || currentSession?.user?.createdAt;
  const created = createdAt ? new Date(createdAt) : null;
  const createdElement = document.getElementById('profile-created');
  if (createdElement) {
    createdElement.textContent = created ? created.toLocaleString() : 'Sin fecha disponible';
  }

  const credentialCount =
    currentProfile?.credentialsCount ?? cachedCredentials.length ?? currentSession?.user?.credentialsCount;
  const countElement = document.getElementById('profile-credentials');
  if (countElement) {
    countElement.textContent = String(credentialCount || 0);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function maskValue(value) {
  if (!value) return '••••••';
  const trimmed = String(value).trim();
  if (trimmed.includes('@')) {
    const [name, domain] = trimmed.split('@');
    const shortName = name.slice(0, 2) || '••';
    return `${shortName}***@${domain || '••••'}`;
  }

  return '••••••';
}

function renderCredentials(searchTerm = '') {
  const list = document.getElementById('cred-list');
  const emptyState = document.getElementById('empty-state');
  const totalElement = document.getElementById('total-creds');
  const uniqueElement = document.getElementById('unique-sites');

  if (!list || !emptyState) {
    console.error('No se encontraron contenedores para credenciales');
    return;
  }

  if (totalElement) totalElement.textContent = `${cachedCredentials.length}`;
  if (uniqueElement) {
    const uniqueSites = new Set(cachedCredentials.map((c) => c.site)).size;
    uniqueElement.textContent = `${uniqueSites}`;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = cachedCredentials.filter((cred) => {
    const site = (cred.site || '').toLowerCase();
    const username = (cred.username || '').toLowerCase();
    return site.includes(normalizedSearch) || username.includes(normalizedSearch);
  });

  list.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach((cred) => {
    const item = document.createElement('li');
    item.className = 'cred-item';

    item.innerHTML = `
      <div class="cred-main">
        <div class="cred-info">
          <div class="cred-title">${escapeHtml(cred.site)}</div>
          <div class="cred-user">${escapeHtml(maskValue(cred.username))}</div>
        </div>
        <div class="cred-actions">
          <button class="action-btn view-btn" data-id="${escapeHtml(cred.id)}" title="Ver credencial">
            👁️ Ver
          </button>
          <button class="action-btn delete-btn" data-id="${escapeHtml(cred.id)}" title="Eliminar credencial">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;

    const viewBtn = item.querySelector('.view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        openCredentialModal(cred);
      });
    }

    const deleteBtn = item.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const credentialId = deleteBtn.getAttribute('data-id') ?? '';
        await deleteCredential(credentialId);
      });
    }

    list.appendChild(item);
  });
}

function updateModalFields(unlocked = false) {
  const usernameEl = document.getElementById('modal-username');
  const passwordEl = document.getElementById('modal-password');
  const copyUserBtn = document.getElementById('copy-username');
  const copyPassBtn = document.getElementById('copy-password');
  const deleteBtn = document.getElementById('modal-delete');
  const siteEl = document.getElementById('modal-site');

  if (!selectedCredential) return;

  if (siteEl) siteEl.textContent = selectedCredential.site || 'Detalle de credencial';

  const username = unlocked ? selectedCredential.username || '' : maskValue(selectedCredential.username);
  const password = unlocked ? selectedCredential.password || '' : '••••••';

  if (usernameEl) {
    usernameEl.textContent = username || '—';
    usernameEl.className = unlocked ? 'visible-value' : 'masked-value';
  }

  if (passwordEl) {
    passwordEl.textContent = password || '—';
    passwordEl.className = unlocked ? 'visible-value' : 'masked-value';
  }

  if (copyUserBtn) {
    copyUserBtn.disabled = !unlocked;
    copyUserBtn.dataset.value = unlocked ? username : '';
  }

  if (copyPassBtn) {
    copyPassBtn.disabled = !unlocked;
    copyPassBtn.dataset.value = unlocked ? password : '';
  }

  if (deleteBtn) {
    deleteBtn.disabled = !unlocked;
  }
}

function openCredentialModal(credential) {
  selectedCredential = credential;
  modalUnlocked = false;
  const modal = document.getElementById('credential-modal');
  const pinInput = document.getElementById('modal-pin');
  const errorEl = document.getElementById('modal-error');

  if (!modal) return;

  modal.classList.remove('modal-hidden');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.color = '#fca5a5';
  }
  if (pinInput) {
    pinInput.value = '';
    pinInput.focus();
  }

  updateModalFields(false);
}

function closeCredentialModal() {
  const modal = document.getElementById('credential-modal');
  if (modal) modal.classList.add('modal-hidden');
  selectedCredential = null;
  modalUnlocked = false;
}

async function verifyAndRevealCredential() {
  if (!selectedCredential) return;

  if (modalUnlocked) {
    updateModalFields(true);
    return;
  }

  const pinInput = document.getElementById('modal-pin');
  const errorEl = document.getElementById('modal-error');
  const verifyBtn = document.getElementById('modal-verify');

  const masterPin = pinInput?.value.trim() ?? '';
  if (!/^\d{6}$/.test(masterPin)) {
    if (errorEl) errorEl.textContent = 'El PIN maestro debe tener 6 dígitos.';
    return;
  }

  const session = currentSession ?? getStoredSession();
  if (!session?.token) {
    if (errorEl) errorEl.textContent = 'Debes iniciar sesión nuevamente.';
    return;
  }

  try {
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verificando...';
    }

    await api.verifyMasterPin(masterPin, session.token);
    modalUnlocked = true;
    updateModalFields(true);

    if (errorEl) {
      errorEl.textContent = 'PIN verificado. Información desbloqueada.';
      errorEl.style.color = '#34d399';
    }
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || 'No se pudo validar el PIN maestro';
      errorEl.style.color = '#fca5a5';
    }
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Desbloquear';
    }
  }
}

function setupModal() {
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('modal-cancel');
  const verifyBtn = document.getElementById('modal-verify');
  const deleteBtn = document.getElementById('modal-delete');
  const pinInput = document.getElementById('modal-pin');
  const copyUserBtn = document.getElementById('copy-username');
  const copyPassBtn = document.getElementById('copy-password');

  if (closeBtn) closeBtn.addEventListener('click', closeCredentialModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeCredentialModal);
  if (verifyBtn) verifyBtn.addEventListener('click', verifyAndRevealCredential);
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!selectedCredential?.id) return;
      await deleteCredential(selectedCredential.id);
      closeCredentialModal();
    });
  }

  if (pinInput) {
    pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyAndRevealCredential();
      }
    });
  }

  const handleCopy = (btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value ?? '';
      navigator.clipboard
        .writeText(value)
        .then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copiado ✅';
          setTimeout(() => {
            btn.textContent = original;
          }, 1500);
        })
        .catch((err) => console.error('No se pudo copiar', err));
    });
  };

  if (copyUserBtn) handleCopy(copyUserBtn);
  if (copyPassBtn) handleCopy(copyPassBtn);
}

async function loadCredentials() {
  let backgroundCredentials = [];
  const searchValue = document.getElementById('global-search')?.value ?? '';
  const session = currentSession ?? getStoredSession();

  try {
    backgroundCredentials = await loadFromBackground();
    if (Array.isArray(backgroundCredentials)) {
      cachedCredentials = backgroundCredentials;
    }
  } catch (error) {
    console.error('No se pudieron obtener credenciales desde el background:', error);
  }

  if (session?.token) {
    try {
      const apiCredentials = await api.fetchCredentials(session.token);
      if (Array.isArray(apiCredentials)) {
        const merged = new Map();

        backgroundCredentials?.forEach((cred) => {
          if (cred?.id) merged.set(cred.id, cred);
        });

        apiCredentials.forEach((cred) => {
          if (cred?.id) {
            merged.set(cred.id, cred);
          }
        });

        cachedCredentials = Array.from(merged.values());
      }
    } catch (error) {
      console.error('No se pudieron obtener credenciales desde el backend, usando almacenamiento local', error);
    }
  }

  renderCredentials(searchValue);
  renderProfileDetails();
}

async function loadFromBackground() {
  const activeUserId = resolveActiveUserId();

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS', userId: activeUserId }, async (response) => {
        if (response?.status === 'ok' && Array.isArray(response.data)) {
          resolve(response.data);
          return;
        }

        const localFallback = await fetchLocalVault(activeUserId);
        resolve(localFallback);
      });
    });
  }

  return fetchLocalVault(activeUserId);
}

async function deleteCredential(id) {
  if (!id) return;

  const confirmDelete = window.confirm('¿Eliminar estas credenciales de VaultLocker?');
  if (!confirmDelete) return;

  const session = currentSession ?? getStoredSession();

  if (session?.token) {
    try {
      await api.deleteCredential(id, session.token);
    } catch (error) {
      console.error('No se pudo eliminar en el backend:', error);
    }
  }

  const activeUserId = resolveActiveUserId();

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'DELETE_CREDENTIAL', id, userId: activeUserId }, async (response) => {
        if (response?.status === 'ok') {
          resolve(null);
          return;
        }

        await deleteLocalCredential(activeUserId, id);
        resolve(null);
      });
    });
  } else {
    await deleteLocalCredential(activeUserId, id);
  }

  cachedCredentials = cachedCredentials.filter((c) => c.id !== id);
  renderCredentials(document.getElementById('global-search')?.value ?? '');
  renderProfileDetails();
}

function setupSearch() {
  const searchInput = document.getElementById('global-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    renderCredentials(e.target.value);
  });
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    performLogout();
  });
}

export async function bootstrapAppPage() {
  if (initialized) return;
  initialized = true;

  await hydrateSessionFromExtensionStorage();

  currentSession = getSessionOrRedirect();
  if (!currentSession) return;

  updateUserInfo(currentSession.user);
  renderProfileDetails();
  loadProfile();
  setupLogout();
  setupSearch();
  setupModal();
  loadCredentials();

  console.log('✅ Dashboard profesional inicializado');
}

async function loadProfile() {
  if (!currentSession?.token) return;

  try {
    currentProfile = await api.fetchProfile(currentSession.token);
    renderProfileDetails();
  } catch (error) {
    console.error('No se pudo cargar el perfil del usuario:', error);
  }
}

async function fetchLocalVault(userId) {
  if (!userId || typeof chrome === 'undefined' || !chrome.storage?.local) return [];

  const users = await new Promise((resolve) => {
    chrome.storage.local.get('users', (result) => {
      resolve(result?.users || {});
    });
  });

  const vault = users[userId]?.vault || [];
  const decrypted = [];

  for (const entry of vault) {
    try {
      const plain = await decryptData(entry.encrypted);
      decrypted.push({ id: entry.id, ...plain });
    } catch (error) {
      console.error('No se pudo descifrar la credencial local', error);
    }
  }

  return decrypted;
}

async function deleteLocalCredential(userId, id) {
  if (!userId || !id || typeof chrome === 'undefined' || !chrome.storage?.local) return;

  const users = await new Promise((resolve) => {
    chrome.storage.local.get('users', (result) => resolve(result?.users || {}));
  });

  const vault = users[userId]?.vault || [];
  const updatedVault = vault.filter((entry) => entry.id !== id);

  const updatedUsers = { ...users, [userId]: { ...(users[userId] || {}), vault: updatedVault } };

  await new Promise((resolve) => {
    chrome.storage.local.set({ users: updatedUsers }, resolve);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAppPage);
} else {
  bootstrapAppPage();
}
