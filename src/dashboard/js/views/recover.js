import { api } from '../../../utils/api';

export function initView() {
  const emailInput = document.getElementById('recover-email');
  const masterPinInput = document.getElementById('recover-master-pin');
  const recoveryCodeInput = document.getElementById('recover-code');
  const newPasswordInput = document.getElementById('recover-password');
  const recoverBtn = document.getElementById('recover-btn');
  const errorMsg = document.getElementById('recover-error-msg');
  const successMsg = document.getElementById('recover-success-msg');

  async function handleRecover() {
    const email = emailInput.value.trim();
    const masterPin = masterPinInput.value.trim();
    const recoveryCode = recoveryCodeInput.value.trim();
    const newPassword = newPasswordInput.value;

    errorMsg.textContent = '';
    successMsg.textContent = '';

    if (!email || !masterPin || !recoveryCode || !newPassword) {
      showError('Todos los campos son obligatorios');
      return;
    }

    if (!/^\d{6}$/.test(masterPin)) {
      showError('El PIN maestro debe tener exactamente 6 dígitos');
      return;
    }

    if (newPassword.length < 6) {
      showError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    recoverBtn.disabled = true;
    recoverBtn.textContent = 'Procesando...';

    try {
      const response = await api.recoverPassword({
        email,
        masterPin,
        recoveryCode,
        newPassword,
      });

      const accessToken = response.accessToken || response.access_token;
      if (accessToken) {
        localStorage.setItem('vault_token', accessToken);
        localStorage.setItem('vault_user', JSON.stringify(response.user));

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ vault_token: accessToken, vault_user: response.user });
        }
      }

      if (response.recoveryCode) {
        successMsg.textContent = `Contraseña restablecida. Nuevo código de recuperación: ${response.recoveryCode}`;
        downloadRecoveryFile(email, masterPin, response.recoveryCode);
      } else {
        successMsg.textContent = 'Contraseña restablecida correctamente';
      }

      setTimeout(() => {
        window.location.hash = '/dashboard';
      }, 800);
    } catch (error) {
      showError(error.message || 'No se pudo restablecer la contraseña');
    } finally {
      recoverBtn.disabled = false;
      recoverBtn.textContent = 'Restablecer contraseña';
    }
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.color = '#ef4444';
  }

  function downloadRecoveryFile(email, masterPin, recoveryCode) {
    const lines = [
      'VaultLocker - Nuevo código de recuperación',
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
    link.download = 'vaultlocker-recuperacion-nueva.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (recoverBtn) {
    recoverBtn.addEventListener('click', handleRecover);
  }

  [emailInput, masterPinInput, recoveryCodeInput, newPasswordInput].forEach((input) => {
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRecover();
      });
    }
  });
}
