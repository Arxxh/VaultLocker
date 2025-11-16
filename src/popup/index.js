document.addEventListener('DOMContentLoaded', function () {
  console.log('🎯 POPUP IS RUNNING!!!');

  // Verificar que los elementos existen
  console.log('🔍 Elementos encontrados:');
  console.log('- open-panel:', document.getElementById('open-panel'));
  console.log('- open-panel-2:', document.getElementById('open-panel-2'));
  console.log('- btn-login:', document.getElementById('btn-login'));
  console.log('- btn-register:', document.getElementById('btn-register'));
  console.log('- credentials:', document.getElementById('credentials'));

  // Cargar credenciales
  loadCredentials();

  // Configurar botones
  setupButtons();
});

function loadCredentials() {
  console.log('📦 Loading credentials...');
  chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (res) => {
    console.log('📨 Response from background:', res);

    const list = document.getElementById('credentials');
    if (!list) {
      console.log('❌ #credentials element not found');
      return;
    }

    if (!res?.data || res.data.length === 0) {
      console.log('ℹ️ No credentials found');
      list.innerHTML = `<p style="color:#cbd5e1;text-align:center;">No tienes credenciales guardadas aún.</p>`;
      return;
    }

    console.log(`✅ Found ${res.data.length} credentials`);
    list.innerHTML = '';

    res.data.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'cred-item';
      item.style.animationDelay = `${i * 0.08}s`;

      item.innerHTML = `
        <div class="cred-title">${escapeHtml(c.site)}</div>
        <div class="cred-user">${escapeHtml(c.username)}</div>
      `;

      list.appendChild(item);
    });
  });
}

function setupButtons() {
  console.log('🔄 Setting up buttons...');

  // Función para abrir dashboard
  function openDashboard() {
    console.log('🚀 Opening dashboard...');

    // Usar chrome.tabs.create para abrir en una nueva pestaña
    chrome.tabs.create(
      {
        url: chrome.runtime.getURL('src/dashboard/index.html'),
      },
      function (tab) {
        if (chrome.runtime.lastError) {
          console.error('❌ Error opening dashboard:', chrome.runtime.lastError);
        } else {
          console.log('✅ Dashboard opened in tab:', tab.id);
        }
      }
    );
  }

  // Asignar eventos a todos los botones
  const buttonSelectors = ['#open-panel', '#open-panel-2', '#btn-login', '#btn-register'];

  buttonSelectors.forEach((selector) => {
    const button = document.querySelector(selector);
    if (button) {
      console.log(`✅ Setting up button: ${selector}`);

      // Remover event listeners previos para evitar duplicados
      button.replaceWith(button.cloneNode(true));
      const newButton = document.querySelector(selector);

      newButton.addEventListener('click', function (e) {
        console.log(`🎯 Button clicked: ${selector}`);
        e.preventDefault();
        e.stopPropagation();
        openDashboard();
      });

      // También agregar estilo cursor pointer para indicar que es clickeable
      newButton.style.cursor = 'pointer';
    } else {
      console.log(`❌ Button not found: ${selector}`);
    }
  });

  // Verificar todos los botones en la página
  const allButtons = document.querySelectorAll('button');
  console.log(`📊 Total buttons in popup: ${allButtons.length}`);
  allButtons.forEach((btn, index) => {
    console.log(`Button ${index}:`, {
      id: btn.id,
      text: btn.textContent,
      class: btn.className,
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// También agregar event listeners globales por si acaso
document.addEventListener('click', function (e) {
  if (e.target.matches('#open-panel, #open-panel-2, #btn-login, #btn-register')) {
    console.log('🌎 Global click handler caught:', e.target.id);
    e.preventDefault();
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/dashboard/index.html'),
    });
  }
});
