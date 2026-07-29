/**
 * BSP Suryatech Node.js Entry Point Wrapper
 * Loads the compiled production server bundle at dist/server.cjs
 * This resolves deployment pathing differences on Hostinger, cPanel, and PM2.
 */

import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'server_boot.log');

function logBoot(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] [BOOTSTRAP] ${message}\n`);
  } catch (e) {
    console.error("Failed writing to boot log:", e);
  }
}

logBoot("Bootstrap wrapper server.js execution started.");
logBoot(`Current Working Directory (Cwd): ${process.cwd()}`);
logBoot(`NODE_ENV: ${process.env.NODE_ENV}`);
logBoot(`PORT: ${process.env.PORT}`);

import('./dist/server.cjs').then(() => {
  logBoot("Successfully dynamically imported './dist/server.cjs'.");
}).catch((err) => {
  logBoot(`Bootstrap: Dynamic import of compiled bundle failed: ${err.message}\nStack: ${err.stack}`);
  try {
    // Fallback if loaded in strict CommonJS environment
    logBoot("Attempting CommonJS require fallback for './dist/server.cjs'...");
    require('./dist/server.cjs');
    logBoot("Successfully loaded './dist/server.cjs' via require fallback.");
  } catch (requireErr) {
    logBoot(`Bootstrap: CommonJS require fallback also failed: ${requireErr.message}\nStack: ${requireErr.stack}`);
  }
});

