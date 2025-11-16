import { api } from '../../../utils/api';

export function initView() {
  console.log('Login view initialized');

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-btn');
  const errorMsg = document.getElementById('login-error-msg');
  const togglePassword = document.querySelector('.toggle-password[data-target="login-password"]');

  // Toggle password visibility
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const targetId = togglePassword.getAttribute('data-target');
      const passwordField = document.getElementById(targetId);
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        togglePassword.classList.add('visible');
      } else {
        passwordField.type = 'password';
        togglePassword.classList.remove('visible');
      }
    });
  }

  // Login function
  async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Por favor completa todos los campos');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando sesión...';
    errorMsg.textContent = '';

    try {
      const response = await api.login({ email, password });

      // Guardar en localStorage para el dashboard
      localStorage.setItem('vault_token', response.accessToken);
      localStorage.setItem('vault_user', JSON.stringify(response.user));

      // Redirigir al dashboard
      window.location.hash = '/dashboard';
    } catch (error) {
      showError(error.message || 'Error al iniciar sesión');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.color = '#ef4444';
  }

  // Event listeners
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  // Enter key support
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }
  if (emailInput) {
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }
}
