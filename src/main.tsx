import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AdminProvider } from './components/AdminContext';
import { PermissionProvider } from './components/PermissionProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminProvider>
      <PermissionProvider>
        <App />
      </PermissionProvider>
    </AdminProvider>
  </StrictMode>,
);
