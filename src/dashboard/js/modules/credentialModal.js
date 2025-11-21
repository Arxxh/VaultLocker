import { api } from '../../utils/api';
import { getSession } from './session';
import { getSelectedCredential, resetModalState, setModalUnlocked, setSelectedCredential } from './state';
import { renderMaskedModalFields, renderVisibleModalFields } from './credentialList';

const updateCopyButtons = (credential, unlocked) => {
  const copyUserBtn = document.getElementById('copy-username');
  const copyPassBtn = document.getElementById('copy-password');

  if (copyUserBtn) {
    copyUserBtn.disabled = !unlocked;
    copyUserBtn.dataset.value = unlocked ? credential.username : '';
  }

  if (copyPassBtn) {
    copyPassBtn.disabled = !unlocked;
    copyPassBtn.dataset.value = unlocked ? credential.password : '';
  }
};

const updateModalFields = (credential, unlocked) => {
  const siteEl = document.getElementById('modal-site');
  if (siteEl) siteEl.textContent = credential.site || 'Detalle de credencial';

  if (unlocked) {
    renderVisibleModalFields(credential);
  } else {
    renderMaskedModalFields(credential);
  }

  updateCopyButtons(credential, unlocked);

  const deleteBtn = document.getElementById('modal-delete');
  if (deleteBtn) {
    deleteBtn.disabled = !unlocked;
  }
};

export const openCredentialModal = (credential) => {
  setSelectedCredential(credential);
  setModalUnlocked(false);

  const modal = document.getElementById('credential-modal');
  const pinInput = document.getElementById('modal-pin');
  const errorEl = document.getElementById('modal-error');

  if (!modal) return;

  modal.classList.remove('modal-hidden');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.color = '#fca5a5';
  }
  if (pinInput) {
    pinInput.value = '';
    pinInput.focus();
  }

  updateModalFields(credential, false);
};

export const closeCredentialModal = () => {
  const modal = document.getElementById('credential-modal');
  if (modal) modal.classList.add('modal-hidden');
  resetModalState();
};

const verifyAndRevealCredential = async () => {
  const credential = getSelectedCredential();
  if (!credential) return;

  const pinInput = document.getElementById('modal-pin');
  const errorEl = document.getElementById('modal-error');
  const verifyBtn = document.getElementById('modal-verify');

  const masterPin = pinInput?.value.trim() ?? '';
  if (!/^\d{6}$/.test(masterPin)) {
    if (errorEl) errorEl.textContent = 'El PIN maestro debe tener 6 dígitos.';
    return;
  }

  const session = getSession();
  if (!session?.token) {
    if (errorEl) errorEl.textContent = 'Debes iniciar sesión nuevamente.';
    return;
  }

  try {
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verificando...';
    }

    await api.verifyMasterPin(masterPin, session.token);
    setModalUnlocked(true);
    updateModalFields(credential, true);

    if (errorEl) {
      errorEl.textContent = 'PIN verificado. Información desbloqueada.';
      errorEl.style.color = '#34d399';
    }
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || 'No se pudo validar el PIN maestro';
      errorEl.style.color = '#fca5a5';
    }
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Desbloquear';
    }
  }
};

export const setupModal = (onDelete) => {
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('modal-cancel');
  const verifyBtn = document.getElementById('modal-verify');
  const deleteBtn = document.getElementById('modal-delete');
  const pinInput = document.getElementById('modal-pin');
  const copyUserBtn = document.getElementById('copy-username');
  const copyPassBtn = document.getElementById('copy-password');

  if (closeBtn) closeBtn.addEventListener('click', closeCredentialModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeCredentialModal);
  if (verifyBtn) verifyBtn.addEventListener('click', verifyAndRevealCredential);
  if (deleteBtn && typeof onDelete === 'function') {
    deleteBtn.addEventListener('click', async () => {
      const credential = getSelectedCredential();
      if (!credential?.id) return;
      await onDelete(credential.id);
      closeCredentialModal();
    });
  }

  if (pinInput) {
    pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyAndRevealCredential();
      }
    });
  }

  const handleCopy = (btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value ?? '';
      navigator.clipboard
        .writeText(value)
        .then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copiado ✅';
          setTimeout(() => {
            btn.textContent = original;
          }, 1500);
        })
        .catch((err) => console.error('No se pudo copiar', err));
    });
  };

  if (copyUserBtn) handleCopy(copyUserBtn);
  if (copyPassBtn) handleCopy(copyPassBtn);
};
