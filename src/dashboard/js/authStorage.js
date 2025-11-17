const TOKEN_KEY = 'vault_token';
const USER_KEY = 'vault_user';

function getCredentialsKey(user) {
  const identifier = user?.id || user?.email;
  return identifier ? `credentials_${identifier}` : 'credentials';
}

function parseUser(rawUser) {
  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing stored user:', error);
  }

  return null;
}

export function getStoredSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = parseUser(localStorage.getItem(USER_KEY));

  return {
    token: token || null,
    user,
    isValid: Boolean(token && user),
  };
}

export async function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise((resolve) => {
      chrome.storage.local.set({ [TOKEN_KEY]: token, [USER_KEY]: user }, resolve);
    });
  }
}

export async function clearStoredSession(previousUser = null) {
  const credentialsKey = getCredentialsKey(previousUser);

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(credentialsKey);
  localStorage.removeItem('credentials');

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise((resolve) => {
      chrome.storage.local.remove([TOKEN_KEY, USER_KEY, credentialsKey, 'credentials'], resolve);
    });
  }
}

export function getSessionOrRedirect() {
  const session = getStoredSession();

  if (!session.isValid) {
    window.location.hash = '/login';
    return null;
  }

  return session;
}
