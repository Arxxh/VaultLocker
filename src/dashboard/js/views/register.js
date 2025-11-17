import { api } from '../../../utils/api';

export function initView() {
  console.log('Register view initialized');

  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const masterPinInput = document.getElementById('reg-master-pin');
  const masterPinConfirmInput = document.getElementById('reg-master-pin-confirm');
  const registerBtn = document.getElementById('register-btn');
  const errorMsg = document.getElementById('register-error-msg');
  const recoveryKit = document.getElementById('recovery-kit');
  const recoveryCodeLabel = document.getElementById('recovery-code');
  const recoveryMasterPinLabel = document.getElementById('recovery-master-pin');
  const downloadRecoveryBtn = document.getElementById('download-recovery');
  const goToDashboardBtn = document.getElementById('go-to-dashboard');
  const copyCodeBtn = document.getElementById('copy-recovery-code');
  const copyPinBtn = document.getElementById('copy-master-pin');

  let lastGeneratedRecoveryCode = '';
  let lastMasterPin = '';

  // Toggle password visibility
  document.querySelectorAll('.toggle-password').forEach((toggleButton) => {
    toggleButton.addEventListener('click', () => {
      const targetId = toggleButton.getAttribute('data-target');
      const passwordField = document.getElementById(targetId);
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleButton.classList.add('visible');
      } else {
        passwordField.type = 'password';
        toggleButton.classList.remove('visible');
      }
    });
  });

  // Register function
  async function handleRegister() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const masterPin = masterPinInput.value.trim();
    const masterPinConfirm = masterPinConfirmInput.value.trim();

    if (!email || !password || !masterPin || !masterPinConfirm) {
      showError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!/^\d{6}$/.test(masterPin)) {
      showError('El PIN maestro debe tener exactamente 6 dígitos');
      return;
    }

    if (masterPin !== masterPinConfirm) {
      showError('El PIN maestro no coincide');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creando cuenta...';
    errorMsg.textContent = '';

    try {
      const response = await api.register({ email, password, masterPin });

      const accessToken = response.accessToken || response.access_token;

      if (!accessToken) {
        throw new Error('No se recibió el token de acceso');
      }

      if (!response.recoveryCode) {
        throw new Error('No se generó el código de recuperación');
      }

      const accessToken = response.accessToken || response.access_token;

      if (!accessToken) {
        throw new Error('No se recibió el token de acceso');
      }

      // Guardar en localStorage para el dashboard
      localStorage.setItem('vault_token', accessToken);
      localStorage.setItem('vault_user', JSON.stringify(response.user));

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ vault_token: accessToken, vault_user: response.user });
      }

      lastGeneratedRecoveryCode = response.recoveryCode;
      lastMasterPin = masterPin;
      showRecoveryKit(email);
    } catch (error) {
      showError(error.message || 'Error al crear la cuenta');
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Registrarse';
    }
  }

  function showRecoveryKit(email) {
    if (!recoveryKit) return;

    recoveryMasterPinLabel.textContent = lastMasterPin;
    recoveryCodeLabel.textContent = lastGeneratedRecoveryCode;
    recoveryKit.style.display = 'block';

    if (goToDashboardBtn) {
      goToDashboardBtn.focus();
    }

    if (downloadRecoveryBtn) {
      downloadRecoveryBtn.onclick = () =>
        downloadRecoveryFile(email, lastMasterPin, lastGeneratedRecoveryCode);
    }

    if (copyCodeBtn) {
      copyCodeBtn.onclick = () => copyToClipboard(lastGeneratedRecoveryCode, 'Código copiado');
    }

    if (copyPinBtn) {
      copyPinBtn.onclick = () => copyToClipboard(lastMasterPin, 'PIN copiado');
    }
  }

  function downloadRecoveryFile(email, masterPin, recoveryCode) {
    const lines = [
      'VaultLocker - Kit de recuperación',
      `Fecha: ${new Date().toISOString()}`,
      '',
      `Correo: ${email}`,
      `PIN maestro: ${masterPin}`,
      `Código de recuperación: ${recoveryCode}`,
      '',
      'Guarda este archivo en un lugar seguro. Será necesario junto con tu PIN maestro para restablecer tu contraseña.',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vaultlocker-recuperacion.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function copyToClipboard(value, successMessage) {
    if (!value) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(() => {
        errorMsg.textContent = successMessage;
        errorMsg.style.color = '#10b981';
      });
    } else {
      const input = document.createElement('input');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      errorMsg.textContent = successMessage;
      errorMsg.style.color = '#10b981';
    }
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.color = '#ef4444';
  }

  // Event listeners
  if (registerBtn) {
    registerBtn.addEventListener('click', handleRegister);
  }

  // Enter key support
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegister();
    });
  }
  if (emailInput) {
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegister();
    });
  }

  if (goToDashboardBtn) {
    goToDashboardBtn.addEventListener('click', () => {
      window.location.hash = '/dashboard';
    });
  }
}
