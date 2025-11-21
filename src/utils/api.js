// `import.meta.env` solo está disponible cuando el bundle pasa por Vite.
// En tiempo de ejecución dentro de la extensión (archivos sin compilar),
// `import.meta.env` es `undefined` y acceder a una propiedad provocaba un
// TypeError, evitando que las credenciales se cargaran desde el backend.
const apiUrlFromEnv = typeof import.meta !== 'undefined' ? import.meta?.env?.VITE_API_URL : undefined;

export const API_BASE_URL = apiUrlFromEnv ?? 'http://localhost:3000';

async function request(path, options) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `Error ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message ?? json.error ?? message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  return await res.json();
}

export const api = {
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: async () => {
    const token = localStorage.getItem('vault_token');
    if (!token) {
      return { message: 'No hay sesión activa' };
    }

    return request('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  fetchCredentials: (token) =>
    request('/credentials', {
      method: 'GET',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),

  deleteCredential: (id, token) =>
    request(`/credentials/${id}`, {
      method: 'DELETE',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),

  fetchProfile: (token) =>
    request('/auth/profile', {
      method: 'GET',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }),

  recoverPassword: (payload) =>
    request('/auth/recover', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyMasterPin: (masterPin, token) =>
    request('/auth/verify-pin', {
      method: 'POST',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      body: JSON.stringify({ masterPin }),
    }),
};
