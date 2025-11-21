import { api } from '../../../utils/api';
import { decryptData } from '../../../utils/crypto';
import { renderCredentials, syncProfileStats } from './credentialList';
import { renderProfileDetails } from './profile';
import { getSession, resolveActiveUserId } from './session';
import { getCachedCredentials, setCachedCredentials } from './state';

let isWatchingStorage = false;

const getCredentialsKey = (userId) => (userId ? `credentials_${userId}` : 'credentials');

const decryptVaultEntries = async (entries = []) => {
  const decrypted = [];

  for (const entry of entries) {
    if (!entry?.id || !entry?.encrypted) continue;

    const base = { id: entry.id, site: entry.site, username: entry.username };

    try {
      const plain = await decryptData(entry.encrypted);
      decrypted.push({ ...base, ...plain });
    } catch (error) {
      decrypted.push(base);
    }
  }

  return decrypted;
};

const fetchLocalVault = async (userId) => {
  if (!userId) return [];

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return [];
  }

  const key = getCredentialsKey(userId);
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result?.[key] || []));
  });

  return decryptVaultEntries(stored);
};

const loadFromBackground = async () => {
  const activeUserId = resolveActiveUserId();
  if (!activeUserId) return [];

  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return fetchLocalVault(activeUserId);
  }

  const messagePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 3000);

    chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS', userId: activeUserId }, (response) => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });

  try {
    const response = await messagePromise;
    if (response?.status === 'ok' && Array.isArray(response.data)) {
      return decryptVaultEntries(response.data);
    }
  } catch (error) {
    // fallback handled below
  }

  return fetchLocalVault(activeUserId);
};

const mergeCredentialSources = (primary = [], secondary = []) => {
  const merged = new Map();
  primary.forEach((cred) => {
    if (cred?.id) merged.set(cred.id, cred);
  });
  secondary.forEach((cred) => {
    if (cred?.id) merged.set(cred.id, cred);
  });
  return Array.from(merged.values());
};

export const loadCredentials = async () => {
  const searchValue = document.getElementById('global-search')?.value ?? '';
  const session = getSession();
  let backgroundCredentials = [];

  try {
    backgroundCredentials = await loadFromBackground();
    setCachedCredentials(backgroundCredentials);
  } catch (error) {
    console.error('No se pudieron leer credenciales desde background:', error);
  }

  if (session?.token) {
    try {
      const apiCredentials = await api.fetchCredentials(session.token);
      if (Array.isArray(apiCredentials) && apiCredentials.length > 0) {
        setCachedCredentials(mergeCredentialSources(backgroundCredentials, apiCredentials));
      }
    } catch (error) {
      console.error('No se pudieron leer credenciales desde API:', error);
    }
  }

  renderCredentials(searchValue);
  renderProfileDetails();
};

export const initCredentialSync = () => {
  if (isWatchingStorage || typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return;
  }

  isWatchingStorage = true;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    const activeUserId = resolveActiveUserId();
    const watchedKey = getCredentialsKey(activeUserId);

    const hasRelevantChange = Object.keys(changes).some(
      (key) => key === 'vault_user' || key === watchedKey || key.startsWith('credentials_')
    );

    if (hasRelevantChange) {
      loadCredentials();
    }
  });
};

export const deleteCredential = async (id) => {
  if (!id) return;

  const confirmDelete = window.confirm('¿Eliminar estas credenciales de VaultLocker?');
  if (!confirmDelete) return;

  const session = getSession();
  if (session?.token) {
    try {
      await api.deleteCredential(id, session.token);
    } catch (error) {
      console.error('No se pudo eliminar en el backend:', error);
    }
  }

  const activeUserId = resolveActiveUserId();

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'DELETE_CREDENTIAL', id, userId: activeUserId },
        async (response) => {
          if (response?.status === 'ok') {
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

  const filtered = getCachedCredentials().filter((c) => c.id !== id);
  setCachedCredentials(filtered);
  renderCredentials(document.getElementById('global-search')?.value ?? '');
  syncProfileStats();
};

const deleteLocalCredential = async (userId, id) => {
  if (!userId || !id || typeof chrome === 'undefined' || !chrome.storage?.local) return;

  const key = getCredentialsKey(userId);
  const vault = await new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result?.[key] || []));
  });

  const updatedVault = vault.filter((entry) => entry.id !== id);

  await new Promise((resolve) => {
    chrome.storage.local.set({ [key]: updatedVault }, resolve);
  });
};
