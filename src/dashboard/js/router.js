async function loadLayout() {
  const html = await fetch('/src/dashboard/templates/layout.html').then((r) => r.text());
  document.getElementById('root').innerHTML = html;
}

async function navigate(page) {
  const container = document.getElementById('view');

  const html = await fetch('/src/dashboard/templates/' + page).then((r) => r.text());
  container.innerHTML = html;

  const jsFile = page.replace('.html', '.js');

  // RUTA ABSOLUTA REAL
  const scriptPath = '/src/dashboard/js/views/' + jsFile;

  console.log('Importando:', scriptPath);

  try {
    const module = await import(scriptPath);
    if (module.initView) module.initView();
  } catch (err) {
    console.warn('No se encontró módulo para:', scriptPath, err);
  }
}

function getPage() {
  const token = localStorage.getItem('vault_token');
  const hash = location.hash.replace('#/', '');

  if (!token && hash !== 'register') return 'login.html';
  if (!hash) return token ? 'dashboard.html' : 'login.html';

  return hash + '.html';
}

window.addEventListener('hashchange', () => navigate(getPage()));
window.addEventListener('DOMContentLoaded', async () => {
  await loadLayout();
  navigate(getPage());
});
