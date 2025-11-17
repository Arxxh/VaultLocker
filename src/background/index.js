import { encryptData, decryptData } from '../utils/crypto.js';

/**
 * @typedef {Object} Message
 * @property {'SAVE_CREDENTIAL' | 'GET_CREDENTIALS' | 'DELETE_CREDENTIAL'} type
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
 * @property {EncryptedPayload} encrypted
 */

/**
 * @typedef {Object} DecryptedCredential
 * @property {string} id
 * @property {string} site
 * @property {string} username
 * @property {string} password
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

  const encrypted = await encryptData(data);
  const id = crypto.randomUUID();

  const users = await getUsersStorage();
  const vault = users[userId]?.vault || [];

  const updatedUsers = {
    ...users,
    [userId]: { ...(users[userId] || {}), vault: [...vault, { id, encrypted }] },
  };

  await chrome.storage.local.set({ users: updatedUsers });
  console.log(`Credencial guardada para ${data.site}`);
}

async function getAllCredentials(userId) {
  if (!userId) {
    console.warn('Intento de obtener credenciales sin usuario activo');
    return [];
  }

  const users = await getUsersStorage();
  /** @type {Credential[]} */
  const existing = users[userId]?.vault || [];

  /** @type {DecryptedCredential[]} */
  const decrypted = [];

  for (const entry of existing) {
    try {
      const plain = await decryptData(entry.encrypted);
      decrypted.push({ id: entry.id, ...plain });
    } catch (e) {
      console.error('Fallo al descifrar', e);
    }
  }

  return decrypted;
}

/**
 * @param {string} id
 */
async function deleteCredential(userId, id) {
  if (!userId) {
    throw new Error('No hay un usuario activo para eliminar credenciales');
  }

  const users = await getUsersStorage();
  /** @type {Credential[]} */
  const existing = users[userId]?.vault || [];

  const filtered = existing.filter((e) => e.id !== id);

  const updatedUsers = {
    ...users,
    [userId]: { ...(users[userId] || {}), vault: filtered },
  };

  await chrome.storage.local.set({ users: updatedUsers });
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

async function getUsersStorage() {
  const stored = await chrome.storage.local.get('users');
  const users = stored.users || {};

  if (typeof users !== 'object') {
    return {};
  }

  return users;
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
