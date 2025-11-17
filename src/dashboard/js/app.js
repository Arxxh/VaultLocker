import { performLogout } from './logout';

console.log('🚀 VaultLocker App loaded!');

class VaultLockerApp {
  constructor() {
    this.currentView = 'credentials';
    this.init();
  }

  async init() {
    console.log('🏁 Initializing VaultLocker App...');

    // Verificar autenticación
    if (!this.isAuthenticated()) {
      console.log('🔐 Not authenticated, redirecting to login');
      window.location.hash = '/login';
      return;
    }

    await this.loadAppLayout();
    await this.loadView(this.currentView);
    this.setupAppEvents();

    console.log('✅ VaultLocker App initialized');
  }

  isAuthenticated() {
    const token = localStorage.getItem('vault_token');
    console.log('🔐 Auth check - token exists:', !!token);
    return !!token;
  }

  async loadAppLayout() {
    try {
      console.log('📦 Loading app layout...');

      // Cargar el layout profesional
      const layoutUrl = chrome.runtime.getURL('src/dashboard/app/components/layout.html');
      const response = await fetch(layoutUrl);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      let html = await response.text();

      // Procesar datos de usuario en el template
      const userData = localStorage.getItem('vault_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const initials = user.email.substring(0, 2).toUpperCase();
          html = html.replace('{{userInitials}}', initials);
        } catch (error) {
          console.error('Error processing user data:', error);
          html = html.replace('{{userInitials}}', 'VL');
        }
      }

      document.getElementById('app-root').innerHTML = html;
      this.updateUserInfo();
    } catch (error) {
      console.error('❌ Error loading app layout:', error);
      this.showError('Error loading application');
    }
  }

  async loadView(viewName) {
    try {
      console.log('👀 Loading view:', viewName);

      const viewUrl = chrome.runtime.getURL(`src/dashboard/app/views/${viewName}.html`);
      const response = await fetch(viewUrl);

      if (!response.ok) throw new Error(`HTTP ${response.status} for ${viewName}`);

      const html = await response.text();

      const container = document.getElementById('app-view');
      if (container) {
        container.innerHTML = html;
      }

      // Cargar el JS de la vista
      const scriptUrl = chrome.runtime.getURL(`src/dashboard/app/views/${viewName}.js`);
      const module = await import(/* @vite-ignore */ scriptUrl);

      if (module.initView) {
        module.initView();
      }

      this.updateActiveNav(viewName);
      this.updateHeader(viewName);
    } catch (error) {
      console.error('❌ Error loading view:', error);
    }
  }

  updateUserInfo() {
    const userData = localStorage.getItem('vault_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);

        // Actualizar nombre de usuario
        const userNameElement = document.getElementById('user-display-name');
        if (userNameElement) {
          userNameElement.textContent = user.email.split('@')[0];
        }

        // Actualizar avatar
        const avatarElement = document.querySelector('.avatar-placeholder');
        if (avatarElement) {
          const initials = user.email.substring(0, 2).toUpperCase();
          avatarElement.textContent = initials;
        }
      } catch (error) {
        console.error('Error updating user info:', error);
      }
    }
  }

  updateActiveNav(activeView) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      const view = item.getAttribute('data-view');
      if (view === activeView) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  updateHeader(viewName) {
    const titleElement = document.getElementById('main-title');
    const subtitleElement = document.getElementById('main-subtitle');

    if (!titleElement || !subtitleElement) return;

    const titles = {
      credentials: { main: 'Credenciales', sub: 'Gestiona todas tus contraseñas guardadas' },
      security: { main: 'Seguridad', sub: 'Configura la seguridad de tu cuenta' },
      settings: { main: 'Configuración', sub: 'Personaliza tu experiencia' },
    };

    const viewTitles = titles[viewName] || { main: viewName, sub: 'Gestiona tus configuraciones' };

    titleElement.textContent = viewTitles.main;
    subtitleElement.textContent = viewTitles.sub;
  }

  setupAppEvents() {
    // Navegación del sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (view && view !== this.currentView) {
          this.currentView = view;
          this.loadView(view);
        }
      });
    });

    // Buscador global
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleGlobalSearch(e.target.value);
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }
  }

  handleGlobalSearch(searchTerm) {
    console.log('🔍 Global search:', searchTerm);
    // Esto se propagará a las vistas que lo necesiten
    if (window.currentView && window.currentView.handleSearch) {
      window.currentView.handleSearch(searchTerm);
    }
  }

  handleLogout() {
    console.log('🚪 Logging out...');
    performLogout();
  }

  showError(message) {
    document.getElementById('app-root').innerHTML = `
      <div style="color: white; padding: 40px; text-align: center;">
        <h2>Application Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  new VaultLockerApp();
});
