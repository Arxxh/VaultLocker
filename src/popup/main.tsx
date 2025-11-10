import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';

interface Credential {
  id: string;
  site: string;
  username: string;
  password: string;
}

const Popup = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (res) => {
      if (res?.data) setCredentials(res.data);
    });
  }, []);

  const openDashboard = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/dashboard/index.html'),
    });
  };

  return (
    <div className="p-4 w-64 bg-gray-900 text-white">
      <h1 className="text-lg font-bold text-green-400 mb-3">VaultLocker</h1>

      {credentials.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">No se han guardado credenciales.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {credentials.map((cred) => (
            <li key={cred.id} className="border border-gray-700 p-2 rounded-md bg-gray-800">
              <p className="text-sm font-semibold">{cred.site}</p>
              <p className="text-xs text-gray-400">{cred.username}</p>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={openDashboard}
        className="w-full bg-green-600 hover:bg-green-700 py-1 rounded text-sm font-medium"
      >
        Abrir Panel
      </button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
