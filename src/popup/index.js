import { api } from '../utils/api';

const hasChrome = typeof chrome !== 'undefined';

let authState = {
  isAuthenticated: false,
  token: null,
  user: null,
  syncedCredentials: [],
};

let localCredentials = [];

document.addEventListener('DOMContentLoaded', async function () {
  console.log('🎯 POPUP IS RUNNING!!!');

  setupButtons();
  setupSearch();
  await syncSession();
});

async function syncSession() {
  console.log('🔄 Syncing session with storage and backend...');
  const { token, user } = await getStoredSession();

  if (!token) {
    console.log('ℹ️ No stored token found');
    authState = { isAuthenticated: false, token: null, user: null, syncedCredentials: [] };
    renderAuthUI();
    return;
  }

  try {
    const credentials = await api.fetchCredentials(token);
    authState = { isAuthenticated: true, token, user, syncedCredentials: credentials ?? [] };
    console.log('✅ Session validated, credentials synced:', credentials?.length ?? 0);
  } catch (error) {
    console.error('❌ Session validation failed:', error);
    await clearStoredSession();
    authState = { isAuthenticated: false, token: null, user: null, syncedCredentials: [] };
  }

  renderAuthUI();
  if (authState.isAuthenticated) {
    await loadCredentials();
  }
}

async function getStoredSession() {
  if (hasChrome && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['vault_token', 'vault_user'], (res) => {
        resolve({
          token: res.vault_token || localStorage.getItem('vault_token'),
          user: res.vault_user || tryParse(localStorage.getItem('vault_user')),
        });
      });
    });
  }

  return {
    token: localStorage.getItem('vault_token'),
    user: tryParse(localStorage.getItem('vault_user')),
  };
}

async function clearStoredSession() {
  if (hasChrome && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['vault_token', 'vault_user'], () => {
        localStorage.removeItem('vault_token');
        localStorage.removeItem('vault_user');
        resolve();
      });
    });
  }

  localStorage.removeItem('vault_token');
  localStorage.removeItem('vault_user');
  return Promise.resolve();
}

function renderAuthUI() {
  const authSection = document.getElementById('auth-section');
  const searchInput = document.getElementById('search');
  const panelButtons = document.querySelectorAll('#open-panel, #open-panel-2');
  const statsCard = document.getElementById('stats-card');
  const credentialsList = document.getElementById('credentials');

  const isLoggedIn = authState.isAuthenticated;

  if (authSection) {
    authSection.style.display = isLoggedIn ? 'none' : 'flex';
  }

  panelButtons.forEach((btn) => {
    if (btn) {
      btn.style.display = isLoggedIn ? 'block' : 'none';
    }
  });

  if (statsCard) {
    statsCard.style.display = isLoggedIn ? 'flex' : 'none';
  }

  if (searchInput) {
    searchInput.disabled = !isLoggedIn;
    searchInput.placeholder = isLoggedIn ? 'Buscar…' : 'Inicia sesión para buscar';
  }

  if (!isLoggedIn && credentialsList) {
    credentialsList.innerHTML =
      '<p style="color:#cbd5e1;text-align:center;">Inicia sesión para ver tus credenciales.</p>';
  }

  updateStats();
}

async function loadCredentials(searchTerm = '') {
  console.log('📦 Loading credentials...');
  if (!hasChrome || !chrome.runtime?.sendMessage) {
    console.warn('⚠️ chrome runtime API no disponible, usando credenciales sincronizadas');
    localCredentials = authState.syncedCredentials || [];
    renderCredentials(searchTerm);
    return;
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (res) => {
      console.log('📨 Response from background:', res);

      const list = document.getElementById('credentials');
      if (!list) {
        console.log('❌ #credentials element not found');
        resolve();
        return;
      }

      localCredentials = res?.data || [];
      renderCredentials(searchTerm);
      resolve();
    });
  });
}

function renderCredentials(searchTerm = '') {
  const list = document.getElementById('credentials');
  if (!list) return;

  const normalized = searchTerm.trim().toLowerCase();
  const filtered = localCredentials.filter((c) => {
    const site = (c.site || '').toLowerCase();
    const username = (c.username || '').toLowerCase();
    return site.includes(normalized) || username.includes(normalized);
  });

  const baseCount = localCredentials.length || authState.syncedCredentials.length;
  updateStats(filtered.length ? filtered.length : baseCount);

  if (!filtered.length) {
    list.innerHTML = `<p style="color:#cbd5e1;text-align:center;">No tienes credenciales guardadas aún.</p>`;
    return;
  }

  list.innerHTML = '';

  filtered.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'cred-item';
    item.style.animationDelay = `${i * 0.08}s`;

    item.innerHTML = `
      <div class="cred-title">${escapeHtml(c.site)}</div>
      <div class="cred-user">${escapeHtml(c.username)}</div>
    `;

    list.appendChild(item);
  });
}

function updateStats(total = null) {
  const totalElement = document.getElementById('total-credentials');
  if (!totalElement) return;

  const count =
    total ??
    (authState.isAuthenticated ? localCredentials.length || authState.syncedCredentials.length : 0);
  totalElement.textContent = count.toString();
}

function setupSearch() {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    renderCredentials(e.target.value);
  });
}

function setupButtons() {
  console.log('🔄 Setting up buttons...');

  function openDashboard() {
    console.log('🚀 Opening dashboard...');

    const targetUrl =
      hasChrome && chrome.runtime?.getURL
        ? chrome.runtime.getURL('src/dashboard/index.html')
        : new URL('/src/dashboard/index.html', window.location.origin).toString();

    if (hasChrome && chrome.tabs?.create) {
      chrome.tabs.create({ url: targetUrl }, function (tab) {
        if (chrome.runtime.lastError) {
          console.error('❌ Error opening dashboard:', chrome.runtime.lastError);
        } else {
          console.log('✅ Dashboard opened in tab:', tab?.id ?? 'unknown');
        }
      });
      return;
    }

    const newWindow = window.open(targetUrl, '_blank');
    if (!newWindow || newWindow.closed) {
      console.warn('⚠️ window.open bloqueado, navegando en la misma pestaña');
      window.location.href = targetUrl;
    }
  }

  const buttonSelectors = ['#open-panel', '#open-panel-2'];

  buttonSelectors.forEach((selector) => {
    const button = document.querySelector(selector);
    if (!button) return;

    button.addEventListener('click', function (e) {
      console.log(`🖱️ Botón ${selector} clicado`);
      e.preventDefault();
      e.stopPropagation();
      openDashboard();
    });

    button.style.cursor = 'pointer';
    button.tabIndex = 0;
  });

  const loginButton = document.getElementById('btn-login');
  if (loginButton) {
    loginButton.addEventListener('click', () => openDashboard());
  }

  const registerButton = document.getElementById('btn-register');
  if (registerButton) {
    registerButton.addEventListener('click', () => openDashboard());
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function tryParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn('Failed to parse stored user', e);
    return null;
  }
}
