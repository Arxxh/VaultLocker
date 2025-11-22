import { encryptData, decryptData } from '../utils/crypto.js';

/**
 * @typedef {Object} Message
 * @property {'SAVE_CREDENTIAL' | 'GET_CREDENTIALS' | 'DELETE_CREDENTIAL' | 'GET_CREDENTIALS_WITH_PASSWORD'} type
 * @property {Object} [data]
 * @property {string} data.site
 * @property {string} data.username
 * @property {string} data.password
 * @property {string} [id]
 * @property {string} [userId]
 */

/**
 * @typedef {Object} EncryptedPayload
 * @property {number[]} iv
 * @property {number[]} ciphertext
 */

/**
 * @typedef {Object} Credential
 * @property {string} id
 * @property {string} site
 * @property {string} username
 * @property {EncryptedPayload} encrypted
 */

// Listener global
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const processMessage = async () => {
    try {
      const userId = await resolveActiveUserId(message.userId);

      if (message.type === 'SAVE_CREDENTIAL' && message.data) {
        await saveCredential(userId, message.data);
        sendResponse({ status: 'ok' });
      } else if (message.type === 'GET_CREDENTIALS') {
        const creds = await getAllCredentials(userId);
        sendResponse({ status: 'ok', data: creds });
      } else if (message.type === 'GET_CREDENTIALS_WITH_PASSWORD') {
        const creds = await getAllCredentialsWithPasswords(userId);
        sendResponse({ status: 'ok', data: creds });
      } else if (message.type === 'DELETE_CREDENTIAL' && message.id) {
        await deleteCredential(userId, message.id);
        sendResponse({ status: 'ok' });
      } else {
        sendResponse({ status: 'ignored' });
      }
    } catch (err) {
      console.error('Error en background:', err);
      sendResponse({ status: 'error', error: String(err) });
    }
  };

  processMessage();
  return true;
});

// ====== Funciones auxiliares ======

/**
 * @param {string | null} userId
 * @param {{site: string, username: string, password: string}} data
 */
async function saveCredential(userId, data) {
  if (!userId) {
    throw new Error('No hay un usuario activo para guardar credenciales');
  }

  const encrypted = await encryptData({ password: data.password });
  const id = crypto.randomUUID();

  const key = getCredentialsKey(userId);
  const existing = await getStoredCredentials(key);

  const updatedVault = [
    ...existing,
    {
      id,
      site: data.site,
      username: data.username,
      encrypted,
    },
  ];

  await chrome.storage.local.set({ [key]: updatedVault });
  console.log(`Credencial guardada para ${data.site}`);
}

async function getAllCredentials(userId) {
  if (!userId) {
    console.warn('Intento de obtener credenciales sin usuario activo');
    return [];
  }

  const key = getCredentialsKey(userId);
  const existing = await getStoredCredentials(key);

  if (existing.length === 0) {
    return await readLegacyVault(userId);
  }

  return existing;
}

async function getAllCredentialsWithPasswords(userId) {
  const raw = await getAllCredentials(userId);
  const enriched = [];

  for (const entry of raw) {
    if (!entry?.encrypted) continue;
    try {
      const plain = await decryptData(entry.encrypted);
      enriched.push({
        id: entry.id,
        site: entry.site,
        username: entry.username,
        password: plain?.password || '',
      });
    } catch (error) {
      console.warn('No se pudo descifrar una credencial para sugerir login', error);
    }
  }

  return enriched;
}

/**
 * @param {string} id
 */
async function deleteCredential(userId, id) {
  if (!userId) {
    throw new Error('No hay un usuario activo para eliminar credenciales');
  }

  const key = getCredentialsKey(userId);
  const existing = await getStoredCredentials(key);

  const filtered = existing.filter((e) => e.id !== id);

  await chrome.storage.local.set({ [key]: filtered });
}

/**
 * @param {string | null | undefined} userId
 */
async function resolveActiveUserId(userId) {
  if (userId) return userId;

  const stored = await chrome.storage.local.get('vault_user');
  const resolved = normalizeUserId(stored?.vault_user);

  if (!resolved) {
    console.warn('No se encontró un usuario activo en el storage');
  }

  return resolved;
}

/**
 * @param {any} user
 */
function normalizeUserId(user) {
  if (!user) return null;
  const candidate = user.id || user._id || user.uid || user.email;
  if (!candidate) return null;
  return String(candidate);
}

function getCredentialsKey(userId) {
  return userId ? `credentials_${userId}` : 'credentials';
}

async function getStoredCredentials(key) {
  const stored = await chrome.storage.local.get([key]);
  const credentials = stored?.[key];

  if (!Array.isArray(credentials)) {
    return [];
  }

  return credentials;
}

async function readLegacyVault(userId) {
  const legacy = await chrome.storage.local.get('users');
  const vault = legacy?.users?.[userId]?.vault || [];

  if (!Array.isArray(vault)) return [];

  const normalized = [];

  for (const entry of vault) {
    const base = {
      id: entry.id,
      site: entry.site,
      username: entry.username,
      encrypted: entry.encrypted,
    };

    if ((!base.site || !base.username) && entry?.encrypted) {
      try {
        const plain = await decryptData(entry.encrypted);
        base.site = base.site || plain.site;
        base.username = base.username || plain.username;
      } catch (error) {
        console.error('No se pudo migrar metadatos legados', error);
      }
    }

    normalized.push(base);
  }

  return normalized;
}
