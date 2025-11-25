import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

// Asegura WebCrypto en entorno Node para probar cifrado.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import { encryptData, decryptData } from '../../src/utils/crypto.js';
import { api } from '../../src/utils/api.js';
import {
  resolveActiveUserId,
  setCurrentSession,
} from '../../src/dashboard/js/modules/state.js';

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

// Stub mínimo de localStorage para las pruebas de estado.
const memoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
};

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalLocalStorage;
});

test('crypto: cifra y descifra conservando datos y variando IV', async () => {
  const payload = { password: 'Secr3t!' };

  const encrypted1 = await encryptData(payload);
  const encrypted2 = await encryptData(payload);

  const decrypted = await decryptData(encrypted1);

  assert.equal(decrypted.password, payload.password, 'La contraseña se recupera tras descifrar');
  assert.notDeepStrictEqual(
    encrypted1.iv,
    encrypted2.iv,
    'Cada cifrado genera un IV distinto para evitar repetición'
  );
});

test('state: resuelve userId activo desde la sesión en memoria', () => {
  setCurrentSession({ user: { id: 'user-123' } });
  assert.equal(resolveActiveUserId(), 'user-123');

  setCurrentSession({ user: { email: 'demo@user.test' } });
  assert.equal(resolveActiveUserId(), 'demo@user.test');
});

test('api: usa token JWT en peticiones de credenciales', async () => {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => [],
    };
  };

  await api.fetchCredentials('token-abc');

  assert.equal(calls.length, 1, 'Se hace una llamada fetch');
  assert.equal(calls[0].url, 'http://localhost:3000/credentials');
  assert.equal(calls[0].options?.headers?.Authorization, 'Bearer token-abc');
});
