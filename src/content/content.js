console.log('VaultLocker content script activo en:', window.location.hostname);

// Observador para detectar formularios dinámicos
const observer = new MutationObserver(() => detectForms());
observer.observe(document.body, { childList: true, subtree: true });

// Llamada inicial
detectForms();

// ==================== FUNCIONES ====================

function detectForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach((formEl) => {
    const form = formEl;

    if (!form.dataset.vaultlocker) {
      form.dataset.vaultlocker = 'true';
      form.addEventListener('submit', onFormSubmit, { capture: true });
    }
  });
}

function onFormSubmit(event) {
  const target = event.target;
  if (!(target instanceof HTMLFormElement)) return;

  const inputs = Array.from(target.querySelectorAll('input'));

  const usernameField = inputs.find((i) => {
    const el = i;
    return /(user|email|login)/i.test(el.name || el.id || '');
  });

  const passwordField = inputs.find((i) => {
    const el = i;
    return el.type === 'password';
  });

  if (usernameField && passwordField) {
    const username = usernameField.value;
    const password = passwordField.value;
    const site = window.location.hostname;

    console.log(`🔍 Detectado login en ${site}`);

    chrome.runtime.sendMessage({
      type: 'SAVE_CREDENTIAL',
      data: { site, username, password },
    });
  }
}
