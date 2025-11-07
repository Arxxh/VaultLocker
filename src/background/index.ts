import { encryptData, decryptData } from '../utils/crypto';

// Tipado explícito de mensajes
interface Credential {
  id: string;
  encrypted: {
    iv: number[];
    ciphertext: number[];
  };
}

interface Message {
  type: 'SAVE_CREDENTIAL' | 'GET_CREDENTIALS' | 'DELETE_CREDENTIAL';
  data?: { site: string; username: string; password: string };
  id?: string;
}

// Listener global
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
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
        console.warn('Mensaje no reconocido:', message.type);
        sendResponse({ status: 'ignored' });
      }
    } catch (err) {
      console.error('Error en background:', err);
      sendResponse({ status: 'error', error: String(err) });
    }
  };

  void processMessage();
  return true;
});

// ====== Funciones auxiliares ======

async function saveCredential(data: { site: string; username: string; password: string }) {
  const encrypted = await encryptData(data);
  const id = crypto.randomUUID();

  const stored = await chrome.storage.local.get('credentials');
  const existing: Credential[] = stored.credentials || [];
  existing.push({ id, encrypted });

  await chrome.storage.local.set({ credentials: existing });
  console.log(`✅ Credencial guardada para ${data.site}`);
}

async function getAllCredentials() {
  const stored = await chrome.storage.local.get('credentials');
  const existing: Credential[] = stored.credentials || [];
  const decrypted: Array<{ id: string; site: string; username: string; password: string }> = [];

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

async function deleteCredential(id: string) {
  const stored = await chrome.storage.local.get('credentials');
  const existing: Credential[] = stored.credentials || [];
  const filtered = existing.filter((e: Credential) => e.id !== id);
  await chrome.storage.local.set({ credentials: filtered });
}
