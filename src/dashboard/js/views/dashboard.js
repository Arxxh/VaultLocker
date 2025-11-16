import { API, authFetch } from '../api.js';

let creds = [];

document.getElementById('logout-btn')?.addEventListener('click', logout);
document.getElementById('search')?.addEventListener('input', render);

async function loadCreds() {
  const res = await authFetch('/credentials');

  if (!res) {
    localStorage.removeItem('vault_token');
    location.hash = '/login';
    return;
  }

  creds = await res.json();
  render();
}

function render() {
  const list = document.getElementById('cred-list');
  const empty = document.getElementById('empty');
  const text = document.getElementById('search').value.toLowerCase();

  const filtered = creds.filter(
    (c) => c.site.toLowerCase().includes(text) || c.username.toLowerCase().includes(text)
  );

  list.innerHTML = '';

  filtered.forEach((c, i) => {
    const li = document.createElement('li');
    li.className = 'cred-item';
    li.style.animationDelay = `${i * 0.05}s`;

    li.innerHTML = `
      <div class="cred-title">${c.site}</div>
      <div class="cred-user">${c.username}</div>
    `;

    list.appendChild(li);
  });

  empty.style.display = filtered.length ? 'none' : 'block';
}

function logout() {
  localStorage.removeItem('vault_token');
  location.hash = '/login';
}

loadCreds();
