import { encryptData, decryptData } from '../utils/crypto.js';

/**
 * @typedef {Object} Message
 * @property {'SAVE_CREDENTIAL' | 'GET_CREDENTIALS' | 'DELETE_CREDENTIAL'} type
 * @property {Object} [data]
 * @property {string} data.site
 * @property {string} data.username
 * @property {string} data.password
 * @property {string} [id]
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
      if (message.type === 'SAVE_CREDENTIAL' && message.data) {
        await saveCredential(message.data);
        sendResponse({ status: 'ok' });
      } else if (message.type === 'GET_CREDENTIALS') {
        const creds = await getAllCredentials();
        sendResponse({ status: 'ok', data: creds });
      } else if (message.type === 'DELETE_CREDENTIAL' && message.id) {
        await deleteCredential(message.id);
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
 * @param {{site: string, username: string, password: string}} data
 */
async function saveCredential(data) {
  const encrypted = await encryptData(data);
  const id = crypto.randomUUID();

  const stored = await chrome.storage.local.get('credentials');
  /** @type {Credential[]} */
  const existing = stored.credentials || [];

  existing.push({ id, encrypted });

  await chrome.storage.local.set({ credentials: existing });
  console.log(`Credencial guardada para ${data.site}`);
}

async function getAllCredentials() {
  const stored = await chrome.storage.local.get('credentials');
  /** @type {Credential[]} */
  const existing = stored.credentials || [];

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
async function deleteCredential(id) {
  const stored = await chrome.storage.local.get('credentials');
  /** @type {Credential[]} */
  const existing = stored.credentials || [];

  const filtered = existing.filter((e) => e.id !== id);

  await chrome.storage.local.set({ credentials: filtered });
}
