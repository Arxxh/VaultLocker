import { getCachedCredentials } from './state';
import { openCredentialModal } from './credentialModal';
import { renderProfileDetails } from './profile';

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const maskValue = (value) => {
  if (!value) return '••••••';
  const trimmed = String(value).trim();
  if (trimmed.includes('@')) {
    const [name, domain] = trimmed.split('@');
    const shortName = name.slice(0, 2) || '••';
    return `${shortName}***@${domain || '••••'}`;
  }
  return '••••••';
};

const updateStats = (credentials) => {
  const totalElement = document.getElementById('total-creds');
  const uniqueElement = document.getElementById('unique-sites');

  if (totalElement) totalElement.textContent = `${credentials.length}`;
  if (uniqueElement) {
    const uniqueSites = new Set(credentials.map((c) => c.site)).size;
    uniqueElement.textContent = `${uniqueSites}`;
  }
};

export const renderCredentials = (searchTerm = '') => {
  const list = document.getElementById('cred-list');
  const emptyState = document.getElementById('empty-state');
  const credentials = getCachedCredentials();

  if (!list || !emptyState) {
    return;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = credentials.filter((cred) => {
    const site = (cred.site || '').toLowerCase();
    const username = (cred.username || '').toLowerCase();
    return site.includes(normalizedSearch) || username.includes(normalizedSearch);
  });

  updateStats(credentials);
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
      </div>
    `;

    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      openCredentialModal(cred);
    });

    list.appendChild(item);
  });
};

export const setupSearch = () => {
  const searchInput = document.getElementById('global-search');
  if (!searchInput) {
    return;
  }

  searchInput.addEventListener('input', (e) => {
    renderCredentials(e.target.value);
  });
};

export const renderMaskedModalFields = (credential) => {
  const usernameEl = document.getElementById('modal-username');
  const passwordEl = document.getElementById('modal-password');

  if (usernameEl) {
    usernameEl.textContent = maskValue(credential.username) || '—';
    usernameEl.className = 'masked-value';
  }

  if (passwordEl) {
    passwordEl.textContent = '••••••';
    passwordEl.className = 'masked-value';
  }
};

export const renderVisibleModalFields = (credential) => {
  const usernameEl = document.getElementById('modal-username');
  const passwordEl = document.getElementById('modal-password');

  if (usernameEl) {
    usernameEl.textContent = credential.username || '—';
    usernameEl.className = 'visible-value';
  }

  if (passwordEl) {
    passwordEl.textContent = credential.password || '—';
    passwordEl.className = 'visible-value';
  }
};

export const syncProfileStats = () => {
  renderProfileDetails();
};
