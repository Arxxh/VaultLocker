// Cargar credenciales obtenidas del background
chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (res) => {
  const list = document.getElementById('credentials');

  if (!res?.data || res.data.length === 0) {
    list.innerHTML = `<p style="color:#cbd5e1;text-align:center;">No tienes credenciales guardadas aún.</p>`;
    return;
  }

  list.innerHTML = '';

  res.data.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'cred-item';
    item.style.animationDelay = `${i * 0.08}s`; // STAGGER REAL

    item.innerHTML = `
      <div class="cred-title">${c.site}</div>
      <div class="cred-user">${c.username}</div>
    `;

    list.appendChild(item);
  });
});

// abrir dashboard
function openDashboard() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('../dashboard/index.html'),
  });
}

document.getElementById('open-panel').onclick = openDashboard;
document.getElementById('open-panel-2').onclick = openDashboard;
