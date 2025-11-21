import { performLogout } from './logout.js';
import { getSessionOrRedirect, getStoredSession } from './authStorage.js';
import { api } from '../../utils/api.js';
import { decryptData } from '../../utils/crypto.js';

let cachedCredentials = [];
let initialized = false;
let currentSession = null;
let currentProfile = null;
let selectedCredential = null;
let modalUnlocked = false;

// ==================== DEBUG TOOLS ====================
function initDebugTools() {
  console.log('🛠️ Inicializando herramientas de debug...');

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
}

function logDebug(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`🔍 ${logMessage}`, data || '');
}

async function runComprehensiveDebug() {
  logDebug('=== INICIANDO DEBUG COMPLETO ===');

  // 1. Debug de sesión
  logDebug('1. Verificando sesión...');
  const session = getStoredSession();
  logDebug('Sesión almacenada:', session);
  logDebug('Sesión actual:', currentSession);
  logDebug('Usuario activo ID:', resolveActiveUserId());

  // 2. Debug de credenciales en caché
  logDebug('3. Credenciales en caché:', cachedCredentials);

  // 3. Debug de elementos DOM
  logDebug('4. Verificando elementos DOM...');
  const domElements = {
    'cred-list': document.getElementById('cred-list'),
    'empty-state': document.getElementById('empty-state'),
    'global-search': document.getElementById('global-search'),
    'user-display-name': document.getElementById('user-display-name'),
    'user-avatar': document.getElementById('user-avatar'),
    'total-creds': document.getElementById('total-creds'),
    'unique-sites': document.getElementById('unique-sites'),
    'profile-email': document.getElementById('profile-email'),
    'profile-created': document.getElementById('profile-created'),
    'profile-credentials': document.getElementById('profile-credentials'),
  };

  logDebug(
    'Elementos DOM encontrados:',
    Object.keys(domElements).filter((key) => domElements[key])
  );

  // 4. Forzar recarga de credenciales
  logDebug('5. Forzando recarga de credenciales...');
  await loadCredentials();

  logDebug('=== DEBUG COMPLETADO ===');
}

function emergencyRender() {
  console.log('🚨 EMERGENCY RENDER - Forzando visualización...');

  const list = document.getElementById('cred-list');
  const emptyState = document.getElementById('empty-state');

  if (!list) {
    console.error('❌ cred-list NO EXISTE');
    // Buscar cualquier lista en el documento
    const allLists = document.querySelectorAll('ul, .cred-list, .credentials-list');
    console.log('Todas las listas encontradas:', allLists);
    return;
  }

  if (!emptyState) {
    console.error('❌ empty-state NO EXISTE');
    return;
  }

  console.log('✅ Elementos encontrados, renderizando...');
  console.log('Credenciales a renderizar:', cachedCredentials);

  // Usar EXACTAMENTE la misma lógica que el popup
  if (cachedCredentials.length === 0) {
    emptyState.style.display = 'block';
    list.innerHTML = '';
    console.log('📭 No hay credenciales para mostrar');
    return;
  }

  emptyState.style.display = 'none';
  list.innerHTML = '';

  cachedCredentials.forEach((cred, index) => {
    console.log(`🔄 Renderizando credencial ${index + 1}:`, cred);

    const item = document.createElement('li');
    item.className = 'cred-item';

    // USAR EL MISMO ESTILO QUE EL POPUP - SIMPLE Y FUNCIONAL
    item.innerHTML = `
      <div class="cred-main">
        <div class="cred-info">
          <div class="cred-title">${escapeHtml(cred.site)}</div>
          <div class="cred-user">${escapeHtml(cred.username)}</div>
        </div>
      </div>
    `;

    // Agregar evento de clic para abrir modal
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      console.log('👁️ Abriendo modal para credencial:', cred.id);
      openCredentialModal(cred);
    });

    list.appendChild(item);
  });

  console.log(
    '✅ EMERGENCY RENDER COMPLETADO - Se renderizaron',
    cachedCredentials.length,
    'credenciales'
  );
}

// ==================== CORE FUNCTIONS ====================

function resolveActiveUserId() {
  const session = currentSession ?? getStoredSession();
  const user = session?.user;

  if (!user) {
    logDebug('❌ No se encontró usuario en la sesión');
    return null;
  }

  const candidate = user.id || user._id || user.uid || user.email;
  const result = candidate ? String(candidate) : null;

  logDebug(`🆔 ID de usuario resuelto: ${result}`);
  return result;
}

function updateUserInfo(user) {
  if (!user) {
    logDebug('❌ No hay usuario para actualizar info');
    return;
  }

  try {
    const userNameElement = document.getElementById('user-display-name');
    if (userNameElement) {
      userNameElement.textContent = user.email.split('@')[0];
      logDebug(`👤 Nombre de usuario actualizado: ${userNameElement.textContent}`);
    }

    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
      const initials = user.email.substring(0, 2).toUpperCase();
      avatarElement.textContent = initials;
      logDebug(`🖼️ Avatar actualizado: ${initials}`);
    }

    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) {
      userEmailElement.textContent = user.email;
    }
  } catch (error) {
    logDebug('❌ Error actualizando información del usuario:', error);
  }
}

function renderProfileDetails() {
  logDebug('Renderizando detalles del perfil...');

  const email = currentProfile?.email || currentSession?.user?.email;
  logDebug(`📧 Email del perfil: ${email}`);

  if (email) {
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) {
      profileEmail.textContent = email;
    }
  }

  const createdAt = currentProfile?.createdAt || currentSession?.user?.createdAt;
  const created = createdAt ? new Date(createdAt) : null;
  const createdElement = document.getElementById('profile-created');
  if (createdElement) {
    createdElement.textContent = created ? created.toLocaleString() : 'Sin fecha disponible';
  }

  const credentialCount =
    currentProfile?.credentialsCount ??
    cachedCredentials.length ??
    currentSession?.user?.credentialsCount;
  const countElement = document.getElementById('profile-credentials');
  if (countElement) {
    countElement.textContent = String(credentialCount || 0);
    logDebug(`🔢 Contador de credenciales: ${credentialCount}`);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function maskValue(value) {
  if (!value) return '••••••';
  const trimmed = String(value).trim();
  if (trimmed.includes('@')) {
    const [name, domain] = trimmed.split('@');
    const shortName = name.slice(0, 2) || '••';
    return `${shortName}***@${domain || '••••'}`;
  }
  return '••••••';
}

// NUEVA FUNCIÓN: Usar la misma lógica simple del popup
function renderCredentials(searchTerm = '') {
  console.log('🎯 RENDER CREDENTIALS - INICIANDO...');

  const list = document.getElementById('cred-list');
  const emptyState = document.getElementById('empty-state');

  console.log('🔍 BUSCANDO ELEMENTOS DOM:');
  console.log('- cred-list:', list);
  console.log('- empty-state:', emptyState);
  console.log('- cachedCredentials:', cachedCredentials);

  if (!list || !emptyState) {
    console.error('❌ ERROR: Elementos DOM no encontrados');
    return;
  }

  console.log('✅ Elementos DOM encontrados, procediendo a renderizar...');

  // ACTUALIZAR ESTADÍSTICAS
  const totalElement = document.getElementById('total-creds');
  const uniqueElement = document.getElementById('unique-sites');

  if (totalElement) totalElement.textContent = `${cachedCredentials.length}`;
  if (uniqueElement) {
    const uniqueSites = new Set(cachedCredentials.map((c) => c.site)).size;
    uniqueElement.textContent = `${uniqueSites}`;
  }

  // FILTRAR (igual que en popup)
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = cachedCredentials.filter((cred) => {
    const site = (cred.site || '').toLowerCase();
    const username = (cred.username || '').toLowerCase();
    return site.includes(normalizedSearch) || username.includes(normalizedSearch);
  });

  console.log(`🔍 Búsqueda: "${searchTerm}" -> ${filtered.length} resultados`);

  // LIMPIAR LISTA
  list.innerHTML = '';

  // MOSTRAR ESTADO VACÍO O CREDENCIALES (igual que en popup)
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    console.log('📭 Mostrando estado vacío');
    return;
  }

  emptyState.style.display = 'none';

  // RENDERIZAR CREDENCIALES (SIMPLE como en popup)
  filtered.forEach((cred, index) => {
    console.log(`📝 Renderizando credencial ${index + 1}:`, cred);

    const item = document.createElement('li');
    item.className = 'cred-item';

    // HTML SIMPLE - igual que en popup
    item.innerHTML = `
      <div class="cred-main">
        <div class="cred-info">
          <div class="cred-title">${escapeHtml(cred.site)}</div>
          <div class="cred-user">${escapeHtml(cred.username)}</div>
        </div>
      </div>
    `;

    // Hacer clickeable para abrir modal
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      console.log('👁️ Abriendo modal para credencial:', cred.id);
      openCredentialModal(cred);
    });

    list.appendChild(item);
  });

  console.log(`✅ Renderizadas ${filtered.length} credenciales`);
}

function updateModalFields(unlocked = false) {
  const usernameEl = document.getElementById('modal-username');
  const passwordEl = document.getElementById('modal-password');
  const copyUserBtn = document.getElementById('copy-username');
  const copyPassBtn = document.getElementById('copy-password');
  const deleteBtn = document.getElementById('modal-delete');
  const siteEl = document.getElementById('modal-site');

  if (!selectedCredential) return;

  if (siteEl) siteEl.textContent = selectedCredential.site || 'Detalle de credencial';

  const username = unlocked
    ? selectedCredential.username || ''
    : maskValue(selectedCredential.username);
  const password = unlocked ? selectedCredential.password || '' : '••••••';

  if (usernameEl) {
    usernameEl.textContent = username || '—';
    usernameEl.className = unlocked ? 'visible-value' : 'masked-value';
  }

  if (passwordEl) {
    passwordEl.textContent = password || '—';
    passwordEl.className = unlocked ? 'visible-value' : 'masked-value';
  }

  if (copyUserBtn) {
    copyUserBtn.disabled = !unlocked;
    copyUserBtn.dataset.value = unlocked ? selectedCredential.username : '';
  }

  if (copyPassBtn) {
    copyPassBtn.disabled = !unlocked;
    copyPassBtn.dataset.value = unlocked ? selectedCredential.password : '';
  }

  if (deleteBtn) {
    deleteBtn.disabled = !unlocked;
  }
}

function openCredentialModal(credential) {
  selectedCredential = credential;
  modalUnlocked = false;
  const modal = document.getElementById('credential-modal');
  const pinInput = document.getElementById('modal-pin');
  const errorEl = document.getElementById('modal-error');

  if (!modal) {
    logDebug('❌ Modal no encontrado');
    return;
  }

  modal.classList.remove('modal-hidden');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.color = '#fca5a5';
  }
  if (pinInput) {
    pinInput.value = '';
    pinInput.focus();
  }

  updateModalFields(false);
  logDebug(`✅ Modal abierto para: ${credential.site}`);
}

function closeCredentialModal() {
  const modal = document.getElementById('credential-modal');
  if (modal) modal.classList.add('modal-hidden');
  selectedCredential = null;
  modalUnlocked = false;
  logDebug('✅ Modal cerrado');
}

async function verifyAndRevealCredential() {
  if (!selectedCredential) return;

  if (modalUnlocked) {
    updateModalFields(true);
    return;
  }

  const pinInput = document.getElementById('modal-pin');
  const errorEl = document.getElementById('modal-error');
  const verifyBtn = document.getElementById('modal-verify');

  const masterPin = pinInput?.value.trim() ?? '';
  if (!/^\d{6}$/.test(masterPin)) {
    if (errorEl) errorEl.textContent = 'El PIN maestro debe tener 6 dígitos.';
    return;
  }

  const session = currentSession ?? getStoredSession();
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
    modalUnlocked = true;
    updateModalFields(true);

    if (errorEl) {
      errorEl.textContent = 'PIN verificado. Información desbloqueada.';
      errorEl.style.color = '#34d399';
    }
    logDebug('✅ PIN verificado correctamente');
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || 'No se pudo validar el PIN maestro';
      errorEl.style.color = '#fca5a5';
    }
    logDebug('❌ Error verificando PIN:', error);
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Desbloquear';
    }
  }
}

function setupModal() {
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
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!selectedCredential?.id) return;
      await deleteCredential(selectedCredential.id);
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

  logDebug('✅ Modal configurado');
}

// FUNCIÓN PRINCIPAL DE CARGA - MÁS ROBUSTA
async function loadCredentials() {
  console.log('🔄 INICIANDO CARGA DE CREDENCIALES...');

  let backgroundCredentials = [];
  const searchValue = document.getElementById('global-search')?.value ?? '';
  const session = currentSession ?? getStoredSession();

  try {
    // PRIMERO: Cargar desde background (igual que en popup)
    backgroundCredentials = await loadFromBackground();
    console.log('✅ Credenciales desde background:', backgroundCredentials);

    if (Array.isArray(backgroundCredentials)) {
      cachedCredentials = backgroundCredentials;
    }
  } catch (error) {
    console.error('❌ Error obteniendo credenciales desde background:', error);
  }

  // LUEGO: Intentar con API si hay sesión
  if (session?.token) {
    try {
      const apiCredentials = await api.fetchCredentials(session.token);
      console.log('✅ Credenciales desde API:', apiCredentials);

      if (Array.isArray(apiCredentials) && apiCredentials.length > 0) {
        // Combinar ambas fuentes
        const merged = new Map();

        backgroundCredentials?.forEach((cred) => {
          if (cred?.id) merged.set(cred.id, cred);
        });

        apiCredentials.forEach((cred) => {
          if (cred?.id) {
            merged.set(cred.id, cred);
          }
        });

        cachedCredentials = Array.from(merged.values());
        console.log('🔄 Credenciales fusionadas:', cachedCredentials);
      }
    } catch (error) {
      console.error('❌ Error obteniendo credenciales desde backend:', error);
    }
  }

  console.log('🎯 CREDENCIALES FINALES PARA RENDER:', cachedCredentials);

  // RENDERIZAR INMEDIATAMENTE
  renderCredentials(searchValue);
  renderProfileDetails();

  // FORZAR RENDER DE EMERGENCIA POR SI ACASO
  setTimeout(() => {
    if (cachedCredentials.length > 0) {
      emergencyRender();
    }
  }, 500);
}

async function loadFromBackground() {
  const activeUserId = resolveActiveUserId();
  if (!activeUserId) return [];

  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return fetchLocalVault(activeUserId);
  }

  // PROMESA CON TIMEOUT DE 3 SEGUNDOS
  const messagePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn('Timeout esperando respuesta del background');
      reject(new Error('timeout'));
    }, 3000);

    chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS', userId: activeUserId }, (response) => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) {
        console.error('Error de chrome.runtime:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });

  try {
    const response = await messagePromise;
    if (response?.status === 'ok' && Array.isArray(response.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn('Fallback a almacenamiento local por error/timeout');
  }

  // SIEMPRE caer aquí si falla el mensaje
  return await fetchLocalVault(activeUserId);
}

async function fetchLocalVault(userId) {
  console.log(`🗄️ Buscando vault local para usuario: ${userId}`);

  if (!userId) {
    console.log('❌ No hay userId para buscar vault');
    return [];
  }

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    console.log('❌ chrome.storage no disponible');
    return [];
  }

  const users = await new Promise((resolve) => {
    chrome.storage.local.get('users', (result) => {
      console.log('👥 Usuarios encontrados en storage:', Object.keys(result?.users || {}));
      resolve(result?.users || {});
    });
  });

  const vault = users[userId]?.vault || [];
  console.log(`📦 Vault encontrado: ${vault.length} credenciales`, vault);

  const decrypted = [];

  for (const entry of vault) {
    try {
      let plain;
      if (entry.encrypted) {
        plain = await decryptData(entry.encrypted);
      } else {
        // Formato antiguo: todo en plano
        plain = entry;
        console.warn('Credencial en formato antiguo (sin cifrar)', entry);
      }
      decrypted.push({ id: entry.id, ...plain });
    } catch (error) {
      console.error(`Error descifrando credencial ${entry.id}:`, error);
      // Intentar usar como plano si falla el descifrado
      if (entry.site || entry.username) {
        decrypted.push(entry);
      }
    }
  }

  console.log(`🎉 Credenciales descifradas finales: ${decrypted.length}`, decrypted);
  return decrypted;
}

async function deleteCredential(id) {
  if (!id) return;

  const confirmDelete = window.confirm('¿Eliminar estas credenciales de VaultLocker?');
  if (!confirmDelete) return;

  const session = currentSession ?? getStoredSession();

  if (session?.token) {
    try {
      await api.deleteCredential(id, session.token);
      console.log(`✅ Credencial ${id} eliminada del backend`);
    } catch (error) {
      console.error('❌ No se pudo eliminar en el backend:', error);
    }
  }

  const activeUserId = resolveActiveUserId();

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'DELETE_CREDENTIAL', id, userId: activeUserId },
        async (response) => {
          if (response?.status === 'ok') {
            console.log(`✅ Credencial ${id} eliminada del background`);
            resolve(null);
            return;
          }

          await deleteLocalCredential(activeUserId, id);
          resolve(null);
        }
      );
    });
  } else {
    await deleteLocalCredential(activeUserId, id);
  }

  cachedCredentials = cachedCredentials.filter((c) => c.id !== id);
  renderCredentials(document.getElementById('global-search')?.value ?? '');
  renderProfileDetails();
}

async function deleteLocalCredential(userId, id) {
  if (!userId || !id || typeof chrome === 'undefined' || !chrome.storage?.local) return;

  const users = await new Promise((resolve) => {
    chrome.storage.local.get('users', (result) => resolve(result?.users || {}));
  });

  const vault = users[userId]?.vault || [];
  const updatedVault = vault.filter((entry) => entry.id !== id);

  const updatedUsers = { ...users, [userId]: { ...(users[userId] || {}), vault: updatedVault } };

  await new Promise((resolve) => {
    chrome.storage.local.set({ users: updatedUsers }, resolve);
  });

  console.log(`✅ Credencial ${id} eliminada del almacenamiento local`);
}

function setupSearch() {
  const searchInput = document.getElementById('global-search');
  if (!searchInput) {
    console.log('❌ Campo de búsqueda no encontrado');
    return;
  }

  searchInput.addEventListener('input', (e) => {
    console.log(`🔍 Buscando: "${e.target.value}"`);
    renderCredentials(e.target.value);
  });

  console.log('✅ Búsqueda configurada');
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) {
    console.log('❌ Botón de logout no encontrado');
    return;
  }

  logoutBtn.addEventListener('click', () => {
    console.log('🚪 Cerrando sesión...');
    performLogout();
  });

  console.log('✅ Logout configurado');
}

async function loadProfile() {
  if (!currentSession?.token) return;

  try {
    currentProfile = await api.fetchProfile(currentSession.token);
    console.log('✅ Perfil cargado:', currentProfile);
    renderProfileDetails();
  } catch (error) {
    console.error('❌ No se pudo cargar el perfil del usuario:', error);
  }
}

// ==================== INITIALIZATION ====================

function initializeApp() {
  if (initialized) {
    console.log('⚠️ App ya estaba inicializada');
    return;
  }

  initialized = true;
  console.log('🚀 INICIALIZANDO APLICACIÓN DASHBOARD...');

  // Inicializar herramientas de debug
  initDebugTools();

  currentSession = getSessionOrRedirect();
  if (!currentSession) {
    console.log('❌ No hay sesión, redirigiendo...');
    return;
  }

  console.log('✅ Sesión obtenida:', currentSession);

  // Actualizar información del usuario en el sidebar
  updateUserInfo(currentSession.user);

  // Configurar eventos globales
  setupLogout();
  setupModal();

  console.log('✅ Aplicación inicializada - CARGANDO CREDENCIALES...');

  // Cargar credenciales inmediatamente
  loadCredentials();
}

// Función para inicializar cuando la vista de credenciales esté lista
export function initializeCredentialsView() {
  console.log('🎯 VISTA DE CREDENCIALES DETECTADA - INICIALIZANDO...');

  // Configurar búsqueda
  setupSearch();

  // Forzar recarga
  loadCredentials();

  console.log('✅ Vista de credenciales inicializada');
}

// Para el router - llamar esta función cuando se cargue la vista de credenciales
export function onCredentialsViewLoaded() {
  console.log('🔔 EVENTO: Vista de credenciales cargada');
  initializeCredentialsView();
}

// Inicialización principal
export function bootstrapAppPage() {
  console.log('🎯 BOOTSTRAP APP PAGE INICIADO');
  initializeApp();
}

// Inicialización automática si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAppPage);
} else {
  bootstrapAppPage();
}
