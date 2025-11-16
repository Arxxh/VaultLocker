import { API } from '../api.js';

export function initView() {
  console.log('REGISTER VIEW CARGADA');

  const btn = document.getElementById('register-btn');
  if (!btn) return;

  btn.addEventListener('click', register);

  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
}

async function register() {
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const err = document.getElementById('register-error-msg');

  err.textContent = '';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      err.textContent = 'Error al registrar';
      return;
    }

    alert('Cuenta creada. Inicia sesión.');
    location.hash = '/login';
  } catch {
    err.textContent = 'Error de conexión';
  }
}
