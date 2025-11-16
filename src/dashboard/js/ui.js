// Funciones de UI generales para el dashboard
document.addEventListener('DOMContentLoaded', function () {
  // Toggle password visibility para todos los forms
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('toggle-password')) {
      const targetId = e.target.getAttribute('data-target');
      const passwordField = document.getElementById(targetId);
      if (passwordField) {
        if (passwordField.type === 'password') {
          passwordField.type = 'text';
          e.target.classList.add('visible');
        } else {
          passwordField.type = 'password';
          e.target.classList.remove('visible');
        }
      }
    }
  });
});
