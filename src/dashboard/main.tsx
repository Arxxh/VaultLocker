import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';

const Dashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-green-400">VaultLocker Dashboard</h1>
      <p className="text-sm text-gray-300">
        Aquí podrás gestionar tus contraseñas guardadas localmente.
      </p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
