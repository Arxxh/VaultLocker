import { performLogout } from '../logout';

export function initView() {
  console.log('Dashboard view initialized');

  // Configurar logout
  setupLogout();

  // Configurar buscador
  setupSearch();

  // Cargar credenciales
  loadCredentials();
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      performLogout();
    });
  } else {
    console.log('Logout button not found, will try to create one');
    createLogoutButton();
  }
}

function createLogoutButton() {
  // Crear botón de logout si no existe en el template
  const header = document.querySelector('.dashboard-topbar');
  if (header && !document.getElementById('logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Cerrar Sesión';
    logoutBtn.style.marginLeft = 'auto';
    logoutBtn.style.padding = '8px 16px';
    logoutBtn.style.background = '#ef4444';
    logoutBtn.style.color = 'white';
    logoutBtn.style.border = 'none';
    logoutBtn.style.borderRadius = '4px';
    logoutBtn.style.cursor = 'pointer';

    logoutBtn.addEventListener('click', () => {
      performLogout();
    });

    header.appendChild(logoutBtn);
  }
}

function setupSearch() {
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', renderCredentials);
  }
}

async function loadCredentials() {
  console.log('Loading credentials from background...');

  return new Promise((resolve) => {
    // Comunicarse con el background script para obtener credenciales
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (response) => {
        console.log('Credentials response:', response);

        if (response && response.data) {
          window.creds = response.data;
          console.log(`Loaded ${response.data.length} credentials`);
        } else {
          window.creds = [];
          console.log('No credentials found or error:', response);
        }

        renderCredentials();
        resolve();
      });
    } else {
      console.warn('chrome.runtime not available, using empty credentials');
      window.creds = [];
      renderCredentials();
      resolve();
    }
  });
}

function renderCredentials() {
  const list = document.getElementById('cred-list');
  const empty = document.getElementById('empty');

  if (!list || !empty) {
    console.error('cred-list or empty element not found');
    return;
  }

  const searchInput = document.getElementById('search');
  const searchText = searchInput ? searchInput.value.toLowerCase() : '';
  const credentials = window.creds || [];

  const filtered = credentials.filter(
    (cred) =>
      cred.site.toLowerCase().includes(searchText) ||
      cred.username.toLowerCase().includes(searchText)
  );

  list.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    empty.innerHTML =
      credentials.length === 0
        ? '<p class="text-center small">No hay credenciales guardadas aún.</p>'
        : '<p class="text-center small">No se encontraron credenciales que coincidan con la búsqueda.</p>';
    return;
  }

  empty.style.display = 'none';

  filtered.forEach((cred, index) => {
    const item = document.createElement('li');
    item.className = 'cred-item';
    item.style.animationDelay = `${index * 0.05}s`;

    item.innerHTML = `
      <div class="cred-main">
        <div class="cred-info">
          <div class="cred-title">${escapeHtml(cred.site)}</div>
          <div class="cred-user">${escapeHtml(cred.username)}</div>
        </div>
        <div class="cred-actions">
          <button class="copy-btn" data-username="${escapeHtml(cred.username)}" data-password="${escapeHtml(cred.password)}" title="Copiar contraseña">
            📋
          </button>
          <button class="show-btn" data-password="${escapeHtml(cred.password)}" title="Mostrar contraseña">
            👁️
          </button>
        </div>
      </div>
    `;

    list.appendChild(item);
  });

  // Agregar funcionalidad de copiar
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const password = btn.getAttribute('data-password');

      navigator.clipboard
        .writeText(password)
        .then(() => {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '✅';
          btn.style.background = '#10b981';

          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
          }, 2000);
        })
        .catch((err) => {
          console.error('Error copying to clipboard:', err);
          alert('Error al copiar al portapapeles');
        });
    });
  });

  // Agregar funcionalidad de mostrar contraseña
  document.querySelectorAll('.show-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const password = btn.getAttribute('data-password');
      alert(`Contraseña: ${password}`);
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
