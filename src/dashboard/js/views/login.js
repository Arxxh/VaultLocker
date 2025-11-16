import { API } from '../api.js';

export function initView() {
  console.log('LOGIN VIEW CARGADA');

  const btn = document.getElementById('login-btn');
  if (!btn) return;

  btn.addEventListener('click', login);

  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errorMsg = document.getElementById('login-error-msg');

  errorMsg.textContent = '';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      errorMsg.textContent = 'Credenciales incorrectas';
      return;
    }

    const data = await res.json();
    localStorage.setItem('vault_token', data.access_token);

    location.hash = '/dashboard';
  } catch {
    errorMsg.textContent = 'Error de conexión';
  }
}
