import { loadCredentials } from './credentialService';
import { openCredentialModal } from './credentialModal';
import { getCachedCredentials, getSession, resolveActiveUserId } from './state';

const logDebug = (message, data = null) => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`🔍 ${logMessage}`, data || '');
};

const runComprehensiveDebug = async () => {
  logDebug('=== INICIANDO DEBUG COMPLETO ===');
  logDebug('Sesión actual:', getSession());
  logDebug('Usuario activo ID:', resolveActiveUserId());
  logDebug('Credenciales en caché:', getCachedCredentials());

  const list = document.getElementById('cred-list');
  const emptyState = document.getElementById('empty-state');
  logDebug('Elementos DOM encontrados:', [list?.id, emptyState?.id].filter(Boolean));

  await loadCredentials();
  logDebug('=== DEBUG COMPLETADO ===');
};

const emergencyRender = () => {
  const credentials = getCachedCredentials();
  const list = document.getElementById('cred-list');
  const emptyState = document.getElementById('empty-state');

  if (!list || !emptyState) return;

  if (credentials.length === 0) {
    emptyState.style.display = 'block';
    list.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  list.innerHTML = '';

  credentials.forEach((cred) => {
    const item = document.createElement('li');
    item.className = 'cred-item';
    item.innerHTML = `
      <div class="cred-main">
        <div class="cred-info">
          <div class="cred-title">${cred.site}</div>
          <div class="cred-user">${cred.username}</div>
        </div>
      </div>
    `;

    item.addEventListener('click', () => openCredentialModal(cred));
    list.appendChild(item);
  });
};

export const initDebugTools = () => {
  const debugBtn = document.createElement('button');
  debugBtn.innerHTML = '🐛 Debug';
  debugBtn.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff4444;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    z-index: 10000;
    font-size: 12px;
  `;
  debugBtn.addEventListener('click', runComprehensiveDebug);
  document.body.appendChild(debugBtn);

  const emergencyBtn = document.createElement('button');
  emergencyBtn.innerHTML = '🚨 Emergency Render';
  emergencyBtn.style.cssText = `
    position: fixed;
    top: 50px;
    right: 10px;
    background: #ff8800;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    z-index: 10000;
    font-size: 12px;
  `;
  emergencyBtn.addEventListener('click', emergencyRender);
  document.body.appendChild(emergencyBtn);
};
