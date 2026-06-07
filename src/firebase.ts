/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration as requested
const firebaseConfig = {
  apiKey: "AIzaSyAerqh-IpDlqeLMAMS5vJqX_zeNE5SjOCg",
  authDomain: "bsp-suryatech.firebaseapp.com",
  projectId: "bsp-suryatech",
  storageBucket: "bsp-suryatech.firebasestorage.app",
  messagingSenderId: "784360732953",
  appId: "1:784360732953:web:45a38b96361c2f0346ed88",
  measurementId: "G-7PPSYPHKK2"
};

// Initialize Firebase client-side
const app = initializeApp(firebaseConfig);

// Initialize analytics safely (analytics may not run in certain environments/iframes, so handle gracefully)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics could not be initialized:", e);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

providerSettings: {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

export { app, analytics, signInWithPopup };
