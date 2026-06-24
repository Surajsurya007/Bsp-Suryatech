// =========================================================================
//  SECURE STORAGE POLYFILL & GLOBAL ERROR FILTER FOR SANDBOXED IFRAMES
// =========================================================================
(function() {
  // 1. Silent LocalStorage and SessionStorage polyfill
  const testKey = '__storage_safe_test__';
  let isLocalStorageAvailable = false;
  let isSessionStorageAvailable = false;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      isLocalStorageAvailable = true;
    }
  } catch (e) {
    console.warn('[STORAGE POLYFILL] localStorage is not available or blocked in this environment:', e);
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(testKey, '1');
      window.sessionStorage.removeItem(testKey);
      isSessionStorageAvailable = true;
    }
  } catch (e) {
    console.warn('[STORAGE POLYFILL] sessionStorage is not available or blocked in this environment:', e);
  }

  const createMockStorage = () => {
    const store: Record<string, string> = {};
    return {
      getItem: (key: string): string | null => {
        return key in store ? store[key] : null;
      },
      setItem: (key: string, value: string): void => {
        store[key] = String(value);
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        for (const key in store) {
          delete store[key];
        }
      },
      key: (index: number): string | null => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
      get length(): number {
        return Object.keys(store).length;
      }
    };
  };

  if (!isLocalStorageAvailable && typeof window !== 'undefined') {
    try {
      Object.defineProperty(window, 'localStorage', {
        value: createMockStorage(),
        writable: true,
        configurable: true
      });
      console.log('[STORAGE POLYFILL] localStorage in-memory fallback successfully installed.');
    } catch (e) {
       // Ignore fallback errors
    }
  }

  if (!isSessionStorageAvailable && typeof window !== 'undefined') {
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: createMockStorage(),
        writable: true,
        configurable: true
      });
      console.log('[STORAGE POLYFILL] sessionStorage in-memory fallback successfully installed.');
    } catch (e) {
       // Ignore fallback errors
    }
  }

  // 2. Add requested global error logging and unhandled rejection handlers
  if (typeof window !== 'undefined') {
    // Exact requested window.onerror handler for tracking cross-origin/application defects
    window.onerror = function(message, source, lineno, colno, error) {
      const msg = String(message || '').toLowerCase();
      const isExternalOrScriptError = 
        msg.includes('script error') || 
        msg.includes('razorpay') ||
        (source && !source.includes(window.location.hostname) && !source.includes('localhost') && !source.includes('0.0.0.0'));

      // Gracefully prevent unhandled cross-origin noise from failing standard execution flow
      if (isExternalOrScriptError) {
        console.warn('[HANDLED EXTERNAL SCRIPT ERROR SQUELCHED]:', message, 'from', source, 'line', lineno);
        return true; // prevent error propagation for unhandled cross-origin elements
      }

      console.error('Global Error:', {
        message,
        source,
        lineno,
        colno,
        error
      });
      return false;
    };

    // Exact requested unhandledrejection listener
    window.addEventListener('unhandledrejection', function(event) {
      // Mark as handled to prevent browser or preview iframe container from crashing or logging errors
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {}
      
      console.warn('Unhandled Promise Rejection Handled Safely:', event.reason);
    });

    // Capture other script loader anomalies
    window.addEventListener('error', (event) => {
      const msg = String(event.message || '').toLowerCase();
      const filename = event.filename || '';
      if (msg.includes('script error') || msg.includes('razorpay') || (filename && !filename.includes(window.location.hostname) && !filename.includes('localhost') && !filename.includes('0.0.0.0'))) {
        console.warn('[HANDLED EVENT ERROR SQUELCHED]:', event.message, 'from', filename);
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }
})();

import './index.css';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
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
