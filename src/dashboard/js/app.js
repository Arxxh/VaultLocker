import { performLogout } from './logout';

let cachedCredentials = [];
let initialized = false;

function updateUserInfo() {
  const userData = localStorage.getItem('vault_user');
  if (!userData) return;

  try {
    const user = JSON.parse(userData);
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

    list.appendChild(item);
  });
}

async function loadCredentials() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (response) => {
        cachedCredentials = response?.data ?? [];
        renderCredentials(document.getElementById('global-search')?.value ?? '');
        resolve();
      });
    } else {
      cachedCredentials = [];
      renderCredentials(document.getElementById('global-search')?.value ?? '');
      resolve();
    }
  });
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

  updateUserInfo();
  setupLogout();
  setupSearch();
  loadCredentials();

  console.log('✅ Dashboard profesional inicializado');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAppPage);
} else {
  bootstrapAppPage();
}
