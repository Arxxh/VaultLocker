console.log('VaultLocker content script activo en:', window.location.hostname);

const TOAST_ID = 'vaultlocker-toast';

// Observador para detectar formularios dinámicos y enganchar el submit
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

    chrome.runtime.sendMessage(
      {
        type: 'SAVE_CREDENTIAL',
        data: { site, username, password },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn('SAVE_CREDENTIAL lastError', chrome.runtime.lastError);
          showVaultLockerToast('No se pudieron guardar las credenciales', true);
          return;
        }

        if (response?.status === 'ok') {
          showVaultLockerToast(`Credenciales guardadas para ${site}`);
        } else {
          showVaultLockerToast('No se pudieron guardar las credenciales', true);
        }
      }
    );
  }
}

function showVaultLockerToast(message, isError = false) {
  const existing = document.getElementById(TOAST_ID);
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.textContent = message;

  toast.style.position = 'fixed';
  toast.style.bottom = '16px';
  toast.style.right = '16px';
  toast.style.zIndex = '2147483647';
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '10px';
  toast.style.fontSize = '14px';
  toast.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';
  toast.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';
  toast.style.backdropFilter = 'blur(4px)';
  toast.style.color = '#0f172a';
  toast.style.background = isError
    ? 'linear-gradient(120deg, #fecdd3, #ffe4e6)'
    : 'linear-gradient(120deg, #c7d2fe, #dbeafe)';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms ease';
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}
