const encoder = new TextEncoder();
const decoder = new TextDecoder();

const MASTER_KEY = 'vaultlocker-key'; // temporal, luego derivada de clave maestra del usuario

async function getKey() {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(MASTER_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('vaultlocker'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const encoded = encoder.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext)),
  };
}

export async function decryptData(encrypted) {
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    key,
    new Uint8Array(encrypted.ciphertext)
  );

  return JSON.parse(decoder.decode(decrypted));
}
