console.log('🚀 Dashboard router loaded!');
console.log('Current URL:', window.location.href);
console.log('Current hash:', window.location.hash);
console.log('Extension ID:', chrome.runtime.id);

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
 * CARGAR LAYOUT PRINCIPAL DEL DASHBOARD
 ****************************************************/
async function loadLayout() {
  console.log('📦 Loading layout...');
  try {
    const layoutUrl = chrome.runtime.getURL('src/dashboard/templates/layout.html');
    console.log('Layout URL:', layoutUrl);

    const response = await fetch(layoutUrl);
    console.log('Layout response status:', response.status, response.ok);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Layout HTML loaded:', html.length, 'chars');
    console.log('Layout content preview:', html.substring(0, 200));

    const root = document.getElementById('root');
    if (!root) {
      throw new Error('#root element not found in DOM');
    }

    root.innerHTML = html;
    console.log('✅ Layout loaded successfully');
  } catch (error) {
    console.error('❌ Error loading layout:', error);
    const root = document.getElementById('root') || document.body;
    root.innerHTML = `
      <div style="color: white; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Error loading layout</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Check:</strong> Make sure templates/layout.html exists</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

/****************************************************
 * CARGAR UNA VISTA HTML + SU JS DINÁMICO
 ****************************************************/
async function navigate(page) {
  console.log('🧭 Navigating to:', page);

  // Esperar a que el layout se cargue completamente
  let container = document.getElementById('view');
  if (!container) {
    console.log('⏳ #view not found yet, waiting for layout...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    container = document.getElementById('view');
  }

  if (!container) {
    console.error('❌ #view container not found after waiting!');
    return;
  }

  try {
    // Cargar template HTML
    const templateUrl = chrome.runtime.getURL(`src/dashboard/templates/${page}`);
    console.log('Template URL:', templateUrl);

    const response = await fetch(templateUrl);
    console.log('Template response status:', response.status, response.ok);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} for ${page}`);
    }

    const html = await response.text();
    console.log('Template loaded:', html.length, 'chars');
    console.log('Template content preview:', html.substring(0, 200));

    container.innerHTML = html;
    console.log('✅ Template inserted into #view');

    // Cargar JS de la vista
    const jsFile = page.replace('.html', '.js');
    const scriptPath = `src/dashboard/js/views/${jsFile}`;
    const scriptUrl = chrome.runtime.getURL(scriptPath);

    console.log('Attempting to load JS:', scriptUrl);

    try {
      // Usar import() dinámico para módulos ES6
      const module = await import(/* @vite-ignore */ scriptUrl);
      console.log('✅ JS module loaded:', Object.keys(module));

      if (module.initView) {
        console.log('🚀 Calling initView()');
        module.initView();
      } else {
        console.warn('⚠️ initView() not found in module');
      }
    } catch (jsError) {
      console.warn('❌ Error loading JS module:', jsError);
    }
  } catch (error) {
    console.error('❌ Error loading page:', error);
    container.innerHTML = `
      <div style="color: white; padding: 20px;">
        <h3>Error loading ${page}</h3>
        <p>${error.message}</p>
        <p>URL: ${chrome.runtime.getURL(`src/dashboard/templates/${page}`)}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

/****************************************************
 * LÓGICA CENTRAL DE RUTEO
 ****************************************************/
async function getPage() {
  const token = await getToken();
  const hash = window.location.hash.replace('#/', '') || '';

  console.log('🔄 getPage() - token:', !!token, 'hash:', hash);

  // Si NO hay token → forzar login (excepto register)
  if (!token && hash !== 'register') {
    console.log('➡️ Redirecting to login (no token)');
    return 'login.html';
  }

  // Si no hay hash → enviar al dashboard si hay sesión
  if (!hash) {
    const target = token ? 'dashboard.html' : 'login.html';
    console.log('➡️ No hash, redirecting to:', target);
    return target;
  }

  // Devolver la vista solicitada
  console.log('➡️ Using requested page:', hash + '.html');
  return hash + '.html';
}

/****************************************************
 * EVENTOS DEL SPA
 ****************************************************/
window.addEventListener('hashchange', async () => {
  console.log('📍 Hash changed to:', window.location.hash);
  const page = await getPage();
  await navigate(page);
});

// Inicialización principal
async function initializeApp() {
  console.log('🏁 Initializing dashboard app...');

  try {
    await loadLayout();
    const page = await getPage();
    console.log('📄 Initial page to load:', page);
    await navigate(page);

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
