import { api } from '../../../utils/api';

export function initView() {
  console.log('Register view initialized');

  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const registerBtn = document.getElementById('register-btn');
  const errorMsg = document.getElementById('register-error-msg');
  const togglePassword = document.querySelector('.toggle-password[data-target="reg-password"]');

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

  // Register function
  async function handleRegister() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creando cuenta...';
    errorMsg.textContent = '';

    try {
      const response = await api.register({ email, password });

      // Guardar en localStorage para el dashboard
      localStorage.setItem('vault_token', response.accessToken);
      localStorage.setItem('vault_user', JSON.stringify(response.user));

      // Redirigir al dashboard
      window.location.hash = '/dashboard';
    } catch (error) {
      showError(error.message || 'Error al crear la cuenta');
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = 'Registrarse';
    }
  }

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.color = '#ef4444';
  }

  // Event listeners
  if (registerBtn) {
    registerBtn.addEventListener('click', handleRegister);
  }

  // Enter key support
  if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegister();
    });
  }
  if (emailInput) {
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegister();
    });
  }
}
