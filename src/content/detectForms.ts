// Detecta formularios de login o registro en la página
console.log('VaultLocker content script activo en:', window.location.hostname);

// Busca formularios dinámicamente (también si se cargan con JS)
const observer = new MutationObserver(() => detectForms());
observer.observe(document.body, { childList: true, subtree: true });

// Llamada inicial
detectForms();

// ==================== FUNCIONES ====================

// Recorre los formularios y agrega listeners
function detectForms(): void {
  const forms = document.querySelectorAll('form');
  forms.forEach((form) => {
    if (!form.dataset.vaultlocker) {
      form.dataset.vaultlocker = 'true';
      form.addEventListener('submit', onFormSubmit, { capture: true });
    }
  });
}

// Captura los datos al enviar un formulario
function onFormSubmit(event: SubmitEvent): void {
  const form = event.target as HTMLFormElement;
  if (!form) return;

  const inputs = Array.from(form.querySelectorAll('input'));
  const usernameField = inputs.find((i) => /(user|email|login)/i.test(i.name || i.id || '')) as
    | HTMLInputElement
    | undefined;
  const passwordField = inputs.find((i) => i.type === 'password') as HTMLInputElement | undefined;

  if (usernameField && passwordField) {
    const username = usernameField.value;
    const password = passwordField.value;
    const site = window.location.hostname;

    console.log(`🔍 Detectado login en ${site}`);

    // Envía los datos al background para almacenarlos
    chrome.runtime.sendMessage({
      type: 'SAVE_CREDENTIAL',
      data: { site, username, password },
    });
  }
}
