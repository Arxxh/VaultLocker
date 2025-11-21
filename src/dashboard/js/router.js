console.log('🚀 Dashboard router loaded!');
console.log('Current URL:', window.location.href);
console.log('Current hash:', window.location.hash);

/**
 * Obtiene una URL válida tanto dentro del runtime de Chrome como en entornos
 * de pruebas locales (por ejemplo, sirviendo index.html con Vite).
 *
 * Esto previene que la navegación del dashboard falle cuando `chrome` no está
 * disponible, de modo que la vista /app renderice correctamente en pruebas de
 * escritorio.
 *
 * @param {string} path Ruta relativa al origen del proyecto
 * @returns {string}
 */
function resolveResourceUrl(path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;

  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(normalized);
  }

  return `${window.location.origin}/${normalized}`;
}

/****************************************************
 * UTILIDAD: obtener token desde localStorage
 ****************************************************/
async function getToken() {
  const localToken = localStorage.getItem('vault_token');

  if (localToken) {
    console.log('🔐 Token from localStorage:', localToken);
    return localToken;
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['vault_token'], (res) => {
        const stored = res?.vault_token || null;
        console.log('🔐 Token from chrome.storage:', stored);
        resolve(stored);
      });
    });
  }

  return null;
}

/****************************************************
 * DETERMINAR QUÉ PÁGINA CARGAR
 ****************************************************/
async function getPage() {
  const token = await getToken();
  const hash = location.hash.replace('#/', '');

  console.log('🔄 Routing - token:', !!token, 'hash:', hash);

  // Si NO hay token → forzar login (excepto register)
  const unauthenticatedAllowed = ['register', 'recover', 'login'];

  if (!token && !unauthenticatedAllowed.includes(hash)) {
    console.log('➡️ Redirecting to login (no token)');
    return 'login.html';
  }

  if (token) {
    if (hash !== 'app') {
      console.log('ℹ️ Forzando navegación al dashboard profesional');
      location.hash = '/app';
    }

    console.log('➡️ Authenticated - going to professional dashboard');
    return 'app.html';
  }

  // Devolver la vista solicitada para usuarios sin token
  const targetPage = hash || 'login';
  console.log('➡️ Using requested page:', `${targetPage}.html`);
  return `${targetPage}.html`;
}

/****************************************************
 * CARGAR UNA PÁGINA COMPLETA
 ****************************************************/
async function loadFullPage(page) {
  console.log('📄 Loading full page:', page);

  try {
    const pageUrl = resolveResourceUrl(`src/dashboard/templates/${page}`);
    console.log('Page URL:', pageUrl);

    const response = await fetch(pageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Page loaded:', html.length, 'chars');

    // Reemplazar todo el contenido del body
    document.body.innerHTML = html;

    console.log('✅ Full page loaded successfully');

    if (page === 'app.html') {
      try {
        const appModuleUrl = resolveResourceUrl('src/dashboard/js/app.js');
        const module = await import(/* @vite-ignore */ appModuleUrl);
        if (module.bootstrapAppPage) {
          await module.bootstrapAppPage();
        }
      } catch (error) {
        console.error('❌ Error initializing professional dashboard:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error loading full page:', error);
    document.body.innerHTML = `
      <div style="color: white; padding: 40px; text-align: center;">
        <h2>Error loading page</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

/****************************************************
 * CARGAR PÁGINA CON LAYOUT (para login/register/dashboard viejo)
 ****************************************************/
async function loadPageWithLayout(page) {
  console.log('🏗️ Loading page with layout:', page);

  try {
    // Asegurar contenedor base (se elimina al cargar app.html completo)
    if (!document.getElementById('root')) {
      document.body.innerHTML = '<div id="layout-background"></div><div id="root"></div>';
    }

    // Primero cargar el layout
    const layoutUrl = resolveResourceUrl('src/dashboard/templates/layout.html');
    const layoutResponse = await fetch(layoutUrl);

    if (!layoutResponse.ok) {
      throw new Error(`HTTP ${layoutResponse.status} for layout`);
    }

    const layoutHtml = await layoutResponse.text();
    document.getElementById('root').innerHTML = layoutHtml;
    console.log('✅ Layout loaded');

    // Luego cargar la vista específica
    const viewUrl = resolveResourceUrl(`src/dashboard/templates/${page}`);
    const viewResponse = await fetch(viewUrl);

    if (!viewResponse.ok) {
      throw new Error(`HTTP ${viewResponse.status} for ${page}`);
    }

    const viewHtml = await viewResponse.text();
    const container = document.getElementById('view');

    if (container) {
      container.innerHTML = viewHtml;
      console.log('✅ View loaded into container');
    }

    // Cargar JS de la vista si existe
    const jsFile = page.replace('.html', '.js');
    const scriptPath = `src/dashboard/js/views/${jsFile}`;
    const scriptUrl = resolveResourceUrl(scriptPath);

    try {
      const module = await import(/* @vite-ignore */ scriptUrl);
      if (module.initView) {
        console.log('🚀 Calling initView()');
        module.initView();
      }
    } catch (jsError) {
      console.warn('⚠️ No JS module found for:', page);
    }
  } catch (error) {
    console.error('❌ Error loading page with layout:', error);
    document.body.innerHTML = `
      <div style="color: white; padding: 40px; text-align: center;">
        <h2>Error loading application</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

/****************************************************
 * NAVEGACIÓN PRINCIPAL
 ****************************************************/
async function navigateToPage() {
  const page = await getPage();
  console.log('🧭 Final navigation to:', page);

  // Páginas que se cargan completas (sin layout)
  const fullPages = ['app.html'];

  if (fullPages.includes(page)) {
    await loadFullPage(page);
  } else {
    // Páginas que usan el sistema de layout
    await loadPageWithLayout(page);
  }
}

/****************************************************
 * EVENTOS Y INICIALIZACIÓN
 ****************************************************/
window.addEventListener('hashchange', navigateToPage);

// Inicialización principal
async function initializeApp() {
  console.log('🏁 Initializing dashboard app...');

  try {
    await navigateToPage();
    console.log('✅ Dashboard app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize dashboard app:', error);
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
