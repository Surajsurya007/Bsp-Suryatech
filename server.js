/**
 * BSP Suryatech Node.js Entry Point Wrapper
 * Loads the compiled production server bundle at dist/server.cjs
 * This resolves deployment pathing differences on Hostinger, cPanel, and PM2.
 */

import('./dist/server.cjs').catch((err) => {
  console.error("Bootstrap: Dynamic import of compiled bundle failed, trying require:", err);
  try {
    // Fallback if loaded in strict CommonJS environment
    require('./dist/server.cjs');
  } catch (requireErr) {
    console.error("Bootstrap: Failed loading compiled server bundle via both ESM & CJS:", requireErr);
  }
});
