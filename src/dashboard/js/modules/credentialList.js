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
  console.log('[renderCredentials] total:', credentials.length, 'search:', normalizedSearch);
  const filtered = credentials.filter((cred) => {
    const site = (cred.site || '').toLowerCase();
    const username = (cred.username || '').toLowerCase();
    return site.includes(normalizedSearch) || username.includes(normalizedSearch);
  });
  console.log('[renderCredentials] filtered:', filtered.length);

  updateStats(credentials);
  list.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  let rendered = 0;
  filtered.forEach((cred) => {
    try {
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
      rendered += 1;
    } catch (error) {
      console.error('No se pudo renderizar una credencial', error, cred);
    }
  });

  // Fallback simple si nada se pintó.
  if (rendered === 0 && filtered.length > 0) {
    console.warn('[renderCredentials] Sin elementos renderizados, usando fallback');
    filtered.forEach((cred) => {
      const li = document.createElement('li');
      li.textContent = `${cred.site} — ${cred.username}`;
      li.style.padding = '8px';
      list.appendChild(li);
    });
  }
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
