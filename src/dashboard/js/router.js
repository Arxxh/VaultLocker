console.log('🚀 Dashboard router loaded!');
console.log('Current URL:', window.location.href);
console.log('Current hash:', window.location.hash);

/****************************************************
 * UTILIDAD: obtener token desde localStorage
 ****************************************************/
async function getToken() {
  return new Promise((resolve) => {
    const token = localStorage.getItem('vault_token');
    console.log('🔐 Token from localStorage:', token);
    resolve(token || null);
  });
}

/****************************************************
 * DETERMINAR QUÉ PÁGINA CARGAR
 ****************************************************/
async function getPage() {
  const token = await getToken();
  const hash = location.hash.replace('#/', '');

  console.log('🔄 Routing - token:', !!token, 'hash:', hash);

  // Si NO hay token → forzar login (excepto register)
  const unauthenticatedAllowed = ['register', 'recover'];

  if (!token && !unauthenticatedAllowed.includes(hash)) {
    console.log('➡️ Redirecting to login (no token)');
    return 'login.html';
  }

  // Si hay token y no hay hash específico → ir al dashboard profesional
  if (token && !hash) {
    console.log('➡️ Authenticated, no hash - going to professional dashboard');
    return 'app.html';
  }

  // Si pide app específicamente y está autenticado
  if (token && hash === 'app') {
    console.log('➡️ Going to professional dashboard');
    return 'app.html';
  }

  // Devolver la vista solicitada
  console.log('➡️ Using requested page:', hash + '.html');
  return hash + '.html';
}

/****************************************************
 * CARGAR UNA PÁGINA COMPLETA
 ****************************************************/
async function loadFullPage(page) {
  console.log('📄 Loading full page:', page);

  try {
    const pageUrl = chrome.runtime.getURL(`src/dashboard/templates/${page}`);
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
        const appModuleUrl = chrome.runtime.getURL('src/dashboard/js/app.js');
        const module = await import(/* @vite-ignore */ appModuleUrl);
        if (module.bootstrapAppPage) {
          module.bootstrapAppPage();
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
    const layoutUrl = chrome.runtime.getURL('src/dashboard/templates/layout.html');
    const layoutResponse = await fetch(layoutUrl);

    if (!layoutResponse.ok) {
      throw new Error(`HTTP ${layoutResponse.status} for layout`);
    }

    const layoutHtml = await layoutResponse.text();
    document.getElementById('root').innerHTML = layoutHtml;
    console.log('✅ Layout loaded');

    // Luego cargar la vista específica
    const viewUrl = chrome.runtime.getURL(`src/dashboard/templates/${page}`);
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
    const scriptUrl = chrome.runtime.getURL(scriptPath);

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
