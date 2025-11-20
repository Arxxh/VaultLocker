import { performLogout } from './logout';
import { getSessionOrRedirect, getStoredSession } from './authStorage';
import { api } from '../../utils/api';

let cachedCredentials = [];
let initialized = false;
let currentSession = null;
let currentProfile = null;

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
          <div class="cred-user">${escapeHtml(cred.username)}</div>
        </div>
        <div class="cred-actions">
          <button class="action-btn copy-btn" data-password="${escapeHtml(cred.password)}">
            📋
          </button>
          <button class="action-btn delete-btn" data-id="${escapeHtml(cred.id)}" title="Eliminar credencial">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;

    const copyBtn = item.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const password = copyBtn.getAttribute('data-password') ?? '';
        navigator.clipboard
          .writeText(password)
          .then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅';
            setTimeout(() => {
              copyBtn.innerHTML = originalText;
            }, 2000);
          })
          .catch((err) => {
            console.error('Error copying password:', err);
          });
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
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const activeUserId = resolveActiveUserId();
      chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS', userId: activeUserId }, (response) => {
        const credentials = response?.data ?? [];
        cachedCredentials = credentials;
        resolve(credentials);
      });
    } else {
      resolve([]);
    }
  });
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

  await new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const activeUserId = resolveActiveUserId();
      chrome.runtime.sendMessage({ type: 'DELETE_CREDENTIAL', id, userId: activeUserId }, () => resolve(null));
    } else {
      resolve(null);
    }
  });

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

export function bootstrapAppPage() {
  if (initialized) return;
  initialized = true;

  currentSession = getSessionOrRedirect();
  if (!currentSession) return;

  updateUserInfo(currentSession.user);
  renderProfileDetails();
  loadProfile();
  setupLogout();
  setupSearch();
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAppPage);
} else {
  bootstrapAppPage();
}
