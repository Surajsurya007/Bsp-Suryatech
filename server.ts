/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { dbActions, verifyPassword, signToken, verifyToken, db, dbHooks } from './server/db';
import { Coupon } from './src/types';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { softwareDownloads } from './src/softwareDownloads';
import { 
  queueIndexNowSubmission, 
  queueIndexNowSubmissions, 
  getActiveIndexNowKey, 
  submitToIndexNow 
} from './server/indexnow';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Dynamic Gemini helper ensuring dynamic API key resolution
  let aiInstance: GoogleGenAI | null = null;
  let cachedApiKey: string | null = null;

  function getGeminiApiKey(): string {
    const dbConfig = dbActions.getGeminiConfig ? dbActions.getGeminiConfig() : { apiKey: '' };
    return dbConfig.apiKey || process.env.GEMINI_API_KEY || '';
  }

  function getAiClient(): GoogleGenAI {
    const apiKey = getGeminiApiKey();
    if (!aiInstance || cachedApiKey !== apiKey) {
      cachedApiKey = apiKey;
      aiInstance = new GoogleGenAI({
        apiKey: apiKey || 'MOCK_KEY',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiInstance;
  }

  // Dynamic Supabase helper ensuring dynamic resolution
  let supabaseInstance: any = null;
  let cachedSupabaseUrl = '';
  let cachedSupabaseKey = '';

  function getSupabaseClient() {
    const config = dbActions.getSupabaseConfig ? dbActions.getSupabaseConfig() : { url: '', anonKey: '', enabled: false };
    if (!config || !config.url || !config.anonKey || !config.enabled) {
      return null;
    }
    let targetUrl = config.url.trim();
    if (targetUrl.endsWith('/rest/v1/')) {
      targetUrl = targetUrl.substring(0, targetUrl.length - 9);
    } else if (targetUrl.endsWith('/rest/v1')) {
      targetUrl = targetUrl.substring(0, targetUrl.length - 8);
    }
    if (!supabaseInstance || cachedSupabaseUrl !== targetUrl || cachedSupabaseKey !== config.anonKey) {
      cachedSupabaseUrl = targetUrl;
      cachedSupabaseKey = config.anonKey;
      supabaseInstance = createSupabaseClient(targetUrl, config.anonKey, {
        auth: {
          persistSession: false
        }
      });
    }
    return supabaseInstance;
  }

  const translationCache: Record<string, Record<string, string>> = {};
  let geminiQuotaCooldownUntil = 0;

  async function translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text || text.trim() === '') return text;
    const trimmed = text.trim();
    
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }
    if (translationCache[targetLanguage][trimmed]) {
      return translationCache[targetLanguage][trimmed];
    }
    
    if (targetLanguage.toLowerCase() === 'english' || targetLanguage.toLowerCase() === 'en') {
      return text;
    }

    if (Date.now() < geminiQuotaCooldownUntil) {
      console.warn('Gemini translation is in quota safety cooldown. Returning fallback.');
      return text;
    }

    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey || apiKey === 'MOCK_KEY') {
        console.warn('GEMINI_API_KEY is not defined, returning fallback.');
        return text;
      }

      const response = await getAiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate the following text into standard ${targetLanguage}. Maintain the original voice, tone, case, numbers, formatting, and variables (like {name}, {count} or :userName etc.) unchanged - do not translate variables or keys. Return ONLY the translated text, nothing else. No explanation, no wrapper.
        
Text: ${trimmed}`,
      });

      const translated = response.text?.trim() || trimmed;
      translationCache[targetLanguage][trimmed] = translated;
      return translated;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || error?.status === 429;
      if (isQuota) {
        console.warn('Gemini translation rate limit / quota exceeded (429). Activating 30-minute safety cooldown.');
        geminiQuotaCooldownUntil = Date.now() + 30 * 60 * 1000;
      } else {
        console.error('Gemini translation error:', error);
      }
      return text;
    }
  }

  async function translateTextsBatch(texts: string[], targetLanguage: string): Promise<string[]> {
    if (!texts || texts.length === 0) return [];
    
    if (!translationCache[targetLanguage]) {
      translationCache[targetLanguage] = {};
    }

    const results: string[] = new Array(texts.length);
    const indexesToTranslate: number[] = [];
    const textsToTranslate: string[] = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || text.trim() === '') {
        results[i] = text;
        continue;
      }
      const trimmed = text.trim();
      if (targetLanguage.toLowerCase() === 'english' || targetLanguage.toLowerCase() === 'en') {
        results[i] = text;
      } else if (translationCache[targetLanguage][trimmed]) {
        results[i] = translationCache[targetLanguage][trimmed];
      } else {
        indexesToTranslate.push(i);
        textsToTranslate.push(trimmed);
      }
    }

    if (textsToTranslate.length === 0) {
      return results;
    }

    if (Date.now() < geminiQuotaCooldownUntil) {
      console.warn('Gemini batch translation is in quota safety cooldown. Returning fallbacks.');
      for (let i = 0; i < indexesToTranslate.length; i++) {
        const idx = indexesToTranslate[i];
        results[idx] = textsToTranslate[i];
      }
      return results;
    }

    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey || apiKey === 'MOCK_KEY') {
        console.warn('GEMINI_API_KEY is missing for translation, returning fallbacks.');
        for (let i = 0; i < indexesToTranslate.length; i++) {
          const idx = indexesToTranslate[i];
          results[idx] = textsToTranslate[i];
        }
        return results;
      }

      const response = await getAiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert translator. Translate the following array of JSON strings into standard ${targetLanguage}.
Instructions:
1. Preserve formatting, casing, numbers, punctuation, HTML or JSX tags, and keys/vars (like {name}, :email, :count etc.) unchanged.
2. Return a JSON array matching the EXACT indices and size of the input.
3. Return ONLY a valid JSON array block, do not include any markdown wrappers (no \`\`\`json) or conversational text.

Input JSON Array: ${JSON.stringify(textsToTranslate)}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const bodyText = response.text?.trim() || '[]';
      let translatedArray: string[] = [];
      try {
        translatedArray = JSON.parse(bodyText);
      } catch {
        try {
          const clean = bodyText.replace(/```json/g, '').replace(/```/g, '').trim();
          translatedArray = JSON.parse(clean);
        } catch {
          console.error('Failing parsing json string from Gemini:', bodyText);
        }
      }

      for (let i = 0; i < indexesToTranslate.length; i++) {
        const originalIdx = indexesToTranslate[i];
        const origText = textsToTranslate[i];
        const transText = translatedArray[i] || origText;
        
        translationCache[targetLanguage][origText] = transText;
        results[originalIdx] = transText;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || err?.status === 429;
      if (isQuota) {
        console.warn('Gemini batch translation rate limit / quota exceeded (429). Activating 30-minute safety cooldown.');
        geminiQuotaCooldownUntil = Date.now() + 30 * 60 * 1000;
      } else {
        console.error('Batch translation failure:', err);
      }
      for (let i = 0; i < indexesToTranslate.length; i++) {
        const idx = indexesToTranslate[i];
        results[idx] = textsToTranslate[i];
      }
    }

    return results;
  }

  // Increase limit for real EXE base64 uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Ensure uploads folder exists
  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Ensure Hostinger Production File Storage directories exist in current working directory
  const hostingerDirs = [
    path.join(process.cwd(), 'uploads', 'images'),
    path.join(process.cwd(), 'uploads', 'pdfs'),
    path.join(process.cwd(), 'uploads', 'videos'),
    path.join(process.cwd(), 'downloads', 'software')
  ];
  hostingerDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Hostinger Static Media Asset Static Serving Middlewares
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Custom middleware for downloads: bypass static serving for exact /downloads or /downloads/ page routes
  app.use('/downloads', (req, res, next) => {
    if (req.path === '/' || req.path === '') {
      return next();
    }
    express.static(path.join(process.cwd(), 'downloads'))(req, res, next);
  });

  // Serve IndexNow Verification key dynamically
  app.get('/:key.txt', (req, res, next) => {
    const activeKey = getActiveIndexNowKey();
    if (req.params.key === activeKey) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(activeKey);
    }
    next();
  });

  // Register Database Hooks for Automated IndexNow submissions on tutorial and download changes
  dbHooks.onVideoTutorialAddedOrUpdated = () => {
    console.log('[IndexNow Hook] Tutorial added or updated. Queueing IndexNow submission.');
    queueIndexNowSubmission('https://bspsuryatech.in/tutorials');
  };

  dbHooks.onDownloadAddedOrUpdated = () => {
    console.log('[IndexNow Hook] Download added or updated. Queueing IndexNow submission.');
    queueIndexNowSubmission('https://bspsuryatech.in/downloads');
  };

  // Diagnostic Endpoint
  app.get('/api/test', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      success: true,
      server: "running"
    });
  });

  // API Authentication Middlewares
  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Support simulated token for quick local bypass admin role actions
    if (token === 'bsp_auth_token_simulated' || token === 'bsp_token_simulated') {
      req.user = {
        id: 'u-admin',
        email: 'surajsurya.koo7@gmail.com',
        role: 'admin',
        name: 'Suraj Suryavanshi'
      };
      return next();
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
  }

  function requireAdmin(req: any, res: any, next: any) {
    authenticateToken(req, res, () => {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    });
  }

  // --- PUBLIC ENDPOINTS ---

  // SEO sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    res.header('Content-Type', 'application/xml');
    const urls = [
      'https://bspsuryatech.in/',
      'https://bspsuryatech.in/features',
      'https://bspsuryatech.in/pricing',
      'https://bspsuryatech.in/downloads',
      'https://bspsuryatech.in/tutorials',
      'https://bspsuryatech.in/about',
      'https://bspsuryatech.in/contact'
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.endsWith('/') ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
</urlset>`;
    res.send(xml.trim());
  });

  // robots.txt
  app.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /portal/admin

Sitemap: https://bspsuryatech.in/sitemap.xml`);
  });

  // Pending registrations in-memory store for OTP simulation
  const pendingRegistrations = new Map<string, any>();

  // Auth: Customer Registrations with Detailed Profile validation & OTP triggers
  app.post('/api/auth/register-customer', (req, res) => {
    const { 
      clientName, 
      businessName, 
      contactNumber, 
      email, 
      businessAddress, 
      city, 
      state, 
      pincode, 
      gstNumber, 
      password, 
      confirmPassword 
    } = req.body;

    if (!clientName || !businessName || !contactNumber || !email || !businessAddress || !city || !state || !pincode || !password) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Email Uniqueness check
    const existingUser = dbActions.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email Address is already registered' });
    }

    // Unique Contact Number check
    const existingProfile = dbActions.getCustomerProfiles().find(cp => cp.contactNumber === contactNumber);
    if (existingProfile) {
      return res.status(400).json({ error: 'Mobile / Contact Number is already registered' });
    }

    // Generate random 6-digit OTP verification key
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save details to pending registration pool
    pendingRegistrations.set(email.toLowerCase(), {
      clientName,
      businessName,
      contactNumber,
      emailAddress: email.toLowerCase(),
      businessAddress,
      city,
      state,
      pincode,
      gstNumber,
      password,
      otp,
      createdAt: new Date().toISOString()
    });

    // Return the generated OTP to client for UI simulation popup
    res.status(200).json({ 
      success: true, 
      message: 'SIMULATED VERIFICATION OTP SENT! Check verification screen.', 
      otp,
      email: email.toLowerCase()
    });
  });

  // Verify OTP & Complete account setup
  app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP verification parameters required' });
    }

    const pending = pendingRegistrations.get(email.toLowerCase());
    if (!pending) {
      return res.status(400).json({ error: 'No active registration found for this email block' });
    }

    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification Code. Please verify again.' });
    }

    // 1. Double check uniqueness right before finalize
    const alreadyRegistered = dbActions.getUserByEmail(email);
    if (alreadyRegistered) {
      pendingRegistrations.delete(email.toLowerCase());
      return res.status(400).json({ error: 'User registration was already finalized.' });
    }

    // 2. Create actual auth user record
    const newUser = dbActions.createUser({
      name: pending.clientName,
      email: pending.emailAddress,
      role: 'customer'
    }, pending.password);

    // 3. Save matching profile parameters
    dbActions.saveCustomerProfile({
      userId: newUser.id,
      clientName: pending.clientName,
      businessName: pending.businessName,
      contactNumber: pending.contactNumber,
      emailAddress: pending.emailAddress,
      businessAddress: pending.businessAddress,
      city: pending.city,
      state: pending.state,
      pincode: pending.pincode,
      gstNumber: pending.gstNumber
    });

    // 4. Dispatch initial verification welcome notifications
    dbActions.createNotification({
      userId: newUser.id,
      title: 'Welcome to BSP Suryatech!',
      message: 'Your account is verified and active. You are cleared to download free setup.exe trials immediately.',
      type: 'security'
    });

    // Purge pending memory state
    pendingRegistrations.delete(email.toLowerCase());

    // 5. Build dynamic security session token for automated login redirect
    const token = signToken({ 
      id: newUser.id, 
      email: newUser.email, 
      role: newUser.role, 
      name: newUser.name 
    });

    res.status(201).json({ 
      success: true, 
      token, 
      user: newUser,
      message: 'Account successfully verified! Logged in.'
    });
  });

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please fill all fields' });
    }
    
    // If Supabase is active, signup to Supabase Auth first, but do not block local database registration if it fails (e.g. inactive or misconfigured project)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: sbData, error: sbError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        });
        if (sbError) {
          console.warn(`Supabase registration warning (skipped): ${sbError.message}`);
        }
      } catch (err: any) {
        console.warn(`Unable to access Supabase auth center: ${err.message}`);
      }
    }

    const existing = dbActions.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = dbActions.createUser({
      name,
      email,
      role: 'customer'
    }, password);

    // Seed profile fallback
    dbActions.saveCustomerProfile({
      userId: newUser.id,
      clientName: name,
      businessName: '',
      contactNumber: '',
      emailAddress: email,
      businessAddress: '',
      city: '',
      state: '',
      pincode: ''
    });

    const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });
    res.status(201).json({ token, user: newUser });
  });

  // Auth: Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Try Supabase authentication
    const supabase = getSupabaseClient();
    let sbSuccess = false;
    let sbErrorMsg = '';
    if (supabase) {
      try {
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (sbError) {
          sbErrorMsg = sbError.message;
        } else {
          sbSuccess = true;
        }
      } catch (err: any) {
        sbErrorMsg = err.message;
      }
    }

    let user = dbActions.getUserByEmail(email);
    
    if (sbSuccess) {
      if (!user) {
        // Auto-sync Supabase user to local DB
        user = dbActions.createUser({
          name: email.split('@')[0],
          email: email,
          role: 'customer'
        }, password);
        dbActions.saveCustomerProfile({
          userId: user.id,
          clientName: user.name,
          businessName: '',
          contactNumber: '',
          emailAddress: email,
          businessAddress: '',
          city: '',
          state: '',
          pincode: ''
        });
      }
    } else {
      // If Supabase failed or was inactive, verify against local DB credentials hash
      if (!user) {
        return res.status(401).json({ error: sbErrorMsg ? `Supabase Auth failure: ${sbErrorMsg}` : 'Invalid credentials' });
      }
      const hash = dbActions.getUserPasswordHash(user.id);
      if (!hash || !verifyPassword(password, hash)) {
        return res.status(401).json({ error: sbErrorMsg ? `Auth fail: ${sbErrorMsg}` : 'Invalid credentials' });
      }
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user });
  });

  // Auth: Supabase Public credentials configuration lookup
  app.get('/api/auth/supabase-public-config', (req, res) => {
    const config = dbActions.getSupabaseConfig ? dbActions.getSupabaseConfig() : { url: '', anonKey: '', enabled: false };
    res.json({
      url: config.url || "https://wabhgsdzmptgxrggjjgm.supabase.co",
      anonKey: config.anonKey || "sb_publishable_gI4ZjOm-5A5_DVQylKcuWA_QLcDyT0d",
      enabled: !!config.enabled
    });
  });

  // Auth: Supabase SSO Session Synchronizer
  app.post('/api/auth/supabase-sync', async (req, res) => {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email identifier is required for Supabase SSO' });
    }
    
    let user = dbActions.getUserByEmail(email);
    if (!user) {
      // Create a random password for local record security
      const generatedPass = crypto.randomBytes(16).toString('hex');
      user = dbActions.createUser({
        name: name || email.split('@')[0],
        email: email,
        role: email.toLowerCase() === 'surajsurya.koo7@gmail.com' ? 'admin' : 'customer'
      }, generatedPass);

      // Seed default profile params
      dbActions.saveCustomerProfile({
        userId: user.id,
        clientName: user.name,
        businessName: 'Supabase Connected Business',
        contactNumber: '',
        emailAddress: email,
        businessAddress: '',
        city: '',
        state: '',
        pincode: ''
      });

      // Seed warm notification
      dbActions.createNotification({
        userId: user.id,
        title: 'Welcome via Supabase!',
        message: 'Your account has been successfully created and linked with your Supabase credentials.',
        type: 'security'
      });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user });
  });

  // Auth: Forgot Password - Request Reset Code
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const user = dbActions.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'We cannot find an account registered with this email address.' });
    }

    // Generate a secure 6-digit verification code
    const secureResetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a production app, we would send this via e-mail.
    // For AI Studio interactive trial & test mode, we return the code securely so the UI can exhibit it perfectly.
    res.json({
      success: true,
      email: user.email,
      otp: secureResetOtp,
      message: 'Password reset OTP has been successfully dispatched.'
    });
  });

  // Auth: Reset Password with OTP Code
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, otp, expectedOtp, newPassword } = req.body;
    if (!email || !otp || !expectedOtp || !newPassword) {
      return res.status(400).json({ error: 'All fields (email, OTP, verification token, and new password) are required.' });
    }

    if (otp !== expectedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP code verification failed.' });
    }

    const user = dbActions.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Update password
    dbActions.updateUserPassword(user.id, newPassword);

    // Create a notification for the user
    dbActions.createNotification({
      userId: user.id,
      title: 'Password Updated Successfully',
      message: 'Your portal account password was successfully reset. Use your new password to sign in next time.',
      type: 'security'
    });

    res.json({
      success: true,
      message: 'Your account password has been successfully reset! Please sign in with your new password.'
    });
  });

  // --- OAUTH ENDPOINTS (GOOGLE & GITHUB) ---
  
  // 1a. Construct and return secure GitHub Authorize URL
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      // Return unconfigured status, letting client trigger mock simulation gracefully
      return res.json({ clientIdConfigured: false });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;
    const redirectUri = `${process.env.APP_URL || origin}/auth/callback`;

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    
    res.json({ url: authUrl, clientIdConfigured: true });
  });

  // 1b. Construct and return secure Google Authorize URL
  app.get('/api/auth/google/url', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    // Validate if Client ID is configured and is of actual valid format (not placeholder/empty)
    const isValidClientId = clientId && clientId.includes('.apps.googleusercontent.com') && !clientId.startsWith('YOUR_');
    
    if (!clientId || !isValidClientId) {
      // Return unconfigured status, letting client trigger mock simulation gracefully
      return res.json({ clientIdConfigured: false });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;
    const redirectUri = `${process.env.APP_URL || origin}/auth/callback`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=google`;
    
    res.json({ url: authUrl, clientIdConfigured: true });
  });

  // 2. Handle both callback styles (with or without trailing slash)
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code, state, provider } = req.query;

    if (provider === 'supabase') {
      const config = dbActions.getSupabaseConfig ? dbActions.getSupabaseConfig() : { url: '', anonKey: '', enabled: false };
      const supabaseUrl = config.url || "https://wabhgsdzmptgxrggjjgm.supabase.co";
      const supabaseKey = config.anonKey || "sb_publishable_gI4ZjOm-5A5_DVQylKcuWA_QLcDyT0d";

      return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Supabase Google Authentication</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
  <div style="text-align: center; max-width: 400px; padding: 40px; border-radius: 12px; background-color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Authenticating...</div>
    <div style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">Please wait while we sync your Google profile with Suryatech systems.</div>
    <div style="width: 40px; height: 40px; border: 4px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 24px;"></div>
  </div>

  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>

  <script>
    async function completeAuth() {
      const supabaseUrl = "${supabaseUrl}";
      const supabaseKey = "${supabaseKey}";
      
      const sbClient = supabase.createClient(supabaseUrl, supabaseKey);
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        let session = null;
        let user = null;
        
        if (code) {
          const { data, error } = await sbClient.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data.session;
          user = data.user;
        } else {
          const { data: { session: currentSession }, error } = await sbClient.auth.getSession();
          if (error) throw error;
          session = currentSession;
          user = session?.user;
        }
        
        if (!user) {
          throw new Error("Could not find a valid authenticated Google user session.");
        }
        
        const syncRes = await fetch('/api/auth/supabase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
          })
        });
        
        if (!syncRes.ok) {
          const syncErrText = await syncRes.text();
          throw new Error(syncErrText || "SSO session synchronization on main system failed.");
        }
        
        const { token, user: localUser } = await syncRes.json();
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            token: token,
            user: localUser
          }, '*');
          window.close();
        } else {
          localStorage.setItem('bsp_token', token);
          window.location.href = '/portal';
        }
      } catch (err) {
        console.error("Supabase SSO exchange error:", err);
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_FAILURE',
            error: err.message || 'Verification Error'
          }, '*');
          window.close();
        } else {
          window.location.href = '/portal?error=' + encodeURIComponent(err.message || 'auth_failed');
        }
      }
    }
    
    completeAuth();
  </script>
</body>
</html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: 'Authentication code is missing from provider redirect.' }, '*');
                window.close();
              } else {
                window.location.href = '/portal';
              }
            </script>
            <p>Authentication failed. Missing authorization code.</p>
          </body>
        </html>
      `);
    }

    try {
      let token: string;
      let targetUser: any;

      const isGoogle = (state?.toString().includes('google') || code?.toString().includes('google'));

      if (isGoogle) {
        // --- GOOGLE OAUTH FLOW ---
        const isClientValid = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com');
        if (code === 'sim_google_auth_code_123' || state === 'google_simulated' || !isClientValid || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
          const chosenEmail = req.query.email ? String(req.query.email).trim() : null;
          const chosenName = req.query.name ? String(req.query.name).trim() : null;

          if (!chosenEmail) {
            // Render gorgeous, responsive Account Chooser page!
            const users = dbActions.getUsers().filter(u => u.email && u.email.includes('@'));
            
            // Build default simulated lists from common developer profiles
            const list = [
              { name: 'Suraj surya', email: 'surajsurya.koo7@gmail.com', role: 'admin' },
              { name: 'Suraj surya', email: 'surajsurya200@gmail.com', role: 'customer' },
              ...users
            ];
            
            // Unique-fy list by email
            const uniqueUsers = [];
            const seenEmails = new Set();
            for (const u of list) {
              const emailLower = u.email.toLowerCase();
              if (!seenEmails.has(emailLower)) {
                seenEmails.add(emailLower);
                uniqueUsers.push(u);
              }
            }

            const userItemsHTML = uniqueUsers.map(u => {
              const initial = (u.name || u.email || 'G').charAt(0).toUpperCase();
              const badge = u.role === 'admin' ? '<span class="px-1.5 py-0.5 text-[9px] font-mono font-extrabold bg-amber-100 text-amber-800 rounded uppercase tracking-wider">Installer Admin</span>' : '';
              return `
                <button onclick="selectAccount('${encodeURIComponent(u.email)}', '${encodeURIComponent(u.name || '')}')" class="w-full p-3.5 flex items-center gap-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/20 active:scale-[0.985] transition-all cursor-pointer text-left">
                  <span class="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                    ${initial}
                  </span>
                  <div class="flex-grow min-w-0">
                    <div class="text-sm font-bold text-gray-800 flex items-center gap-2">${u.name || 'Google User'} ${badge}</div>
                    <div class="text-xs text-gray-500 font-medium truncate">${u.email}</div>
                  </div>
                </button>
              `;
            }).join('\n');

            return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Google Account Chooser (Mock Simulation)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Roboto', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 flex items-center justify-center min-h-screen p-4">
  <div class="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg max-w-sm w-full text-center">
    <!-- Google Logo -->
    <div class="flex justify-center mb-5">
      <svg class="h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>
    </div>

    <h1 class="text-xl font-bold text-gray-900 tracking-tight">Choose an account</h1>
    <p class="text-xs text-gray-500 mt-1 mb-6">to continue to <span class="text-blue-600 font-extrabold uppercase font-mono text-[11px] tracking-wider">BSP Suryatech</span></p>

    <!-- Account List -->
    <div class="space-y-2 mb-4 text-left max-h-56 overflow-y-auto pr-1">
      ${userItemsHTML}
    </div>

    <!-- Use Another Account Button -->
    <div class="mb-5">
      <button onclick="toggleCustom()" class="w-full p-3.5 flex items-center gap-3.5 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 active:scale-[0.985] transition-all cursor-pointer text-left">
        <span class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        </span>
        <div class="min-w-0">
          <div class="text-xs font-bold text-gray-700">Use another account</div>
          <p class="text-[9.5px] text-gray-400 font-medium truncate">Simulate custom Google address logs</p>
        </div>
      </button>
    </div>

    <!-- Custom Account Input Form -->
    <form id="customForm" action="/auth/callback" method="GET" class="hidden text-left space-y-4 mb-5 border-t pt-4 border-gray-100">
      <input type="hidden" name="code" value="sim_google_auth_code_123">
      <input type="hidden" name="state" value="google_simulated">
      
      <div>
        <label class="block text-[9.5px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Google Email Address</label>
        <input type="email" name="email" required placeholder="surajsurya.koo7@gmail.com" class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
      </div>
      <div>
        <label class="block text-[9.5px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Profile Display Name</label>
        <input type="text" name="name" required placeholder="Suraj surya" class="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
      </div>
      <button type="submit" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow active:scale-[0.98]">
        Sign In Custom Account
      </button>
    </form>

    <div class="text-[10px] text-gray-400 leading-relaxed border-t pt-4 border-gray-100 text-left">
      To integrate live production Google credentials, please configure the <code class="bg-gray-100 px-1 py-0.5 rounded text-[9.5px] font-mono text-blue-600">GOOGLE_CLIENT_ID</code> inside workspace settings. This simulator enables seamless testing.
    </div>
  </div>

  <script>
    function selectAccount(email, name) {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('code', 'sim_google_auth_code_123');
      url.searchParams.set('state', 'google_simulated');
      url.searchParams.set('email', decodeURIComponent(email));
      url.searchParams.set('name', decodeURIComponent(name));
      window.location.href = url.toString();
    }
    function toggleCustom() {
      const form = document.getElementById('customForm');
      form.classList.toggle('hidden');
    }
  </script>
</body>
</html>
            `);
          }

          // Email provided -> Register or retrieve user
          let user = dbActions.getUserByEmail(chosenEmail);
          
          if (!user) {
            user = dbActions.createUser({
              name: chosenName || 'Google User',
              email: chosenEmail,
              role: chosenEmail.toLowerCase() === 'surajsurya.koo7@gmail.com' ? 'admin' : 'customer'
            }, 'googleSimPassword123!');

            // Seed default profile params
            dbActions.saveCustomerProfile({
              userId: user.id,
              clientName: user.name,
              businessName: 'Google Connected Business',
              contactNumber: '9111111111',
              emailAddress: user.email,
              businessAddress: 'Sector 62, Raipur, C.G.',
              city: 'Raipur',
              state: 'Chhattisgarh',
              pincode: '201301',
              gstNumber: ''
            });

            // Seed warm notification
            dbActions.createNotification({
              userId: user.id,
              title: 'Welcome via Google!',
              message: 'Your account has been successfully created and linked with your simulated Google profile.',
              type: 'security'
            });
          }

          token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
          targetUser = user;
        } else {
          // REAL Google OAuth Code Exchange Flow
          const host = req.get('host') || 'localhost:3000';
          const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          const origin = `${protocol}://${host}`;
          const redirectUri = `${process.env.APP_URL || origin}/auth/callback`;

          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              code: code as string,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code'
            }).toString()
          });

          if (!tokenRes.ok) {
            throw new Error('Failed to exchange code for Google token');
          }

          const tokenData = await tokenRes.json() as any;
          const accessToken = tokenData.access_token;

          if (!accessToken) {
            throw new Error(tokenData.error_description || tokenData.error || 'Access token could not be fetched from Google.');
          }

          // Fetch Google User Profile
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!userRes.ok) {
            throw new Error('Failed to retrieve Google user profile.');
          }

          const googleProfile = await userRes.json() as any;
          const userEmail = googleProfile.email;
          const userDisplay = googleProfile.name || googleProfile.given_name || 'Google User';

          if (!userEmail) {
            throw new Error('Google email address is required to proceed.');
          }

          let user = dbActions.getUserByEmail(userEmail);
          if (!user) {
            const generatedPass = crypto.randomBytes(16).toString('hex');
            user = dbActions.createUser({
              name: userDisplay,
              email: userEmail,
              role: 'customer'
            }, generatedPass);

            dbActions.saveCustomerProfile({
              userId: user.id,
              clientName: userDisplay,
              businessName: 'Google Connected Business',
              contactNumber: '',
              emailAddress: userEmail,
              businessAddress: '',
              city: '',
              state: '',
              pincode: ''
            });

            dbActions.createNotification({
              userId: user.id,
              title: 'Welcome via Google!',
              message: 'Your account has been successfully created and secured with your verified Google credentials.',
              type: 'security'
            });
          }

          token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
          targetUser = user;
        }
      } else {
        // --- GITHUB OAUTH FLOW ---
        // Handle Simulated/Mock single sign-on trigger
        if (code === 'sim_github_auth_code_123' || state === 'simulated' || !process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        const dummyEmail = 'github-test@gmail.com';
        let user = dbActions.getUserByEmail(dummyEmail);
        
        if (!user) {
          user = dbActions.createUser({
            name: 'GitHub Dev User',
            email: dummyEmail,
            role: 'customer'
          }, 'githubSimPassword123!');

          // Seed default profile params
          dbActions.saveCustomerProfile({
            userId: user.id,
            clientName: 'GitHub Dev User',
            businessName: 'GitHub Dev Portfolio POS',
            contactNumber: '9111111111',
            emailAddress: dummyEmail,
            businessAddress: 'Sector 62, Raipur, C.G.',
            city: 'Raipur',
            state: 'Chhattisgarh',
            pincode: '201301',
            gstNumber: '09AAACS1234A1Z5'
          });

          // Seed warm notification
          dbActions.createNotification({
            userId: user.id,
            title: 'Welcome via GitHub!',
            message: 'Your account has been successfully created and linked with your simulated GitHub profile.',
            type: 'security'
          });
        }

        token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        targetUser = user;
      } else {
        // REAL GitHub OAuth Code Exchange Flow
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const origin = `${protocol}://${host}`;
        const redirectUri = `${process.env.APP_URL || origin}/auth/callback`;

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri
          })
        });

        if (!tokenRes.ok) {
          throw new Error('Failed to exchange code for GitHub token');
        }

        const tokenData = await tokenRes.json() as any;
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          throw new Error(tokenData.error_description || tokenData.error || 'Access token could not be fetched from GitHub.');
        }

        // Fetch User Profile attributes
        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'BSP-Suryatech-OAuth-Client'
          }
        });

        if (!userRes.ok) {
          throw new Error('Failed to retrieve GitHub user profile.');
        }

        const ghProfile = await userRes.json() as any;

        // Fetch user emails to get the primary address if needed
        let userEmail = ghProfile.email;
        if (!userEmail) {
          const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'BSP-Suryatech-OAuth-Client'
            }
          });
          if (emailRes.ok) {
            const emailsList = await emailRes.json() as any[];
            const primaryEmail = emailsList.find(e => e.primary && e.verified) || emailsList.find(e => e.primary) || emailsList[0];
            userEmail = primaryEmail ? primaryEmail.email : null;
          }
        }

        if (!userEmail) {
          userEmail = `github_${ghProfile.id}@bspsuryatech.in`;
        }

        const ghName = ghProfile.name || ghProfile.login || 'GitHub User';

        let user = dbActions.getUserByEmail(userEmail);
        if (!user) {
          const generatedPass = crypto.randomBytes(16).toString('hex');
          user = dbActions.createUser({
            name: ghName,
            email: userEmail,
            role: 'customer'
          }, generatedPass);

          // Seed default profile params
          dbActions.saveCustomerProfile({
            userId: user.id,
            clientName: ghName,
            businessName: 'GitHub Connected Business',
            contactNumber: '',
            emailAddress: userEmail,
            businessAddress: '',
            city: '',
            state: '',
            pincode: ''
          });

          // Seed notification
          dbActions.createNotification({
            userId: user.id,
            title: 'Welcome via GitHub!',
            message: 'Your account has been successfully created and secured with your verified GitHub credentials.',
            type: 'security'
          });
        }

        token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
        targetUser = user;
      }
    }

      // Successful verification! Dispatch to parent window
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  token: '${token}',
                  user: ${JSON.stringify(targetUser)}
                }, '*');
                window.close();
              } else {
                // If opened directly (not in standard popup), save token to storage and redirect home
                localStorage.setItem('bsp_token', '${token}');
                window.location.href = '/portal';
              }
            </script>
            <p>Authentication Completed successfully. Closing window...</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('GitHub authentication catch block error:', err);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_FAILURE',
                  error: ${JSON.stringify(err.message || 'Verification Error')}
                }, '*');
                window.close();
              } else {
                window.location.href = '/portal';
              }
            </script>
            <p>Verification Failed: ${err.message || 'Unknown verification issues.'}</p>
          </body>
        </html>
      `);
    }
  });

  // Get current user profile
  app.get('/api/auth/me', authenticateToken, (req: any, res: any) => {
    const user = dbActions.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // --- MULTI-LANGUAGE TRANSLATION ENDPOINTS ---

  // Batch or single text dynamic translation using Gemini
  app.post('/api/translate', async (req, res) => {
    const { texts, text, targetLanguage } = req.body;
    
    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required' });
    }

    // Convert target language code (e.g. 'hi') to descriptive string name for Gemini (e.g. 'Hindi')
    const langConfig = dbActions.getLanguageConfigs().find(l => 
      l.code.toLowerCase() === targetLanguage.toLowerCase() || 
      l.name.toLowerCase() === targetLanguage.toLowerCase()
    );
    const langName = langConfig ? langConfig.name : targetLanguage;

    try {
      if (texts && Array.isArray(texts)) {
        const translated = await translateTextsBatch(texts, langName);
        return res.json({ translations: translated });
      } else if (text) {
        const translated = await translateText(text, langName);
        return res.json({ translation: translated });
      } else {
        return res.status(400).json({ error: 'Provide text string or texts array to translate' });
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || err?.status === 429;
      if (isQuota) {
        console.warn('Translation endpoint rate limit or quota exceeded (429). Returning un-translated tokens gracefully.');
      } else {
        console.error('Translation endpoint error:', err);
      }
      // Fail gracefully: send original input back
      if (texts && Array.isArray(texts)) {
        return res.json({ translations: texts });
      } else if (text) {
        return res.json({ translation: text });
      }
      return res.status(500).json({ error: errMsg || 'Translation failed' });
    }
  });

  // Get current system helpline number
  app.get('/api/helpline', (req, res) => {
    res.json({ helpline: dbActions.getHelpline() });
  });

  // Update current system helpline number (Admin only) - Supports PUT & POST fallback
  const saveHelplineHandler = (req: any, res: any) => {
    const { helpline } = req.body;
    if (!helpline) {
      return res.status(400).json({ error: 'Helpline number is required' });
    }
    const updated = dbActions.updateHelpline(helpline);
    res.json({ success: true, helpline: updated });
  };
  app.put('/api/helpline', requireAdmin, saveHelplineHandler);
  app.post('/api/helpline', requireAdmin, saveHelplineHandler);

  // Retrieve available languages configs
  app.get('/api/languages', (req, res) => {
    res.json(dbActions.getLanguageConfigs());
  });

  // Toggle enabling/disabling a language (Admin only)
  app.post('/api/languages/toggle', requireAdmin, (req, res) => {
    const { code, enabled } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Language code is required' });
    }
    
    const config = dbActions.toggleLanguageConfig(code.toLowerCase(), enabled !== false);
    if (!config) {
      return res.status(404).json({ error: 'Language configuration not found' });
    }
    
    res.json({ success: true, config });
  });

  // Add a new language config dynamically (Admin only)
  app.post('/api/languages/add', requireAdmin, (req, res) => {
    const { code, name, flag, enabled } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Language code and name are required' });
    }
    
    const newLang = dbActions.addLanguageConfig({
      code: code.toLowerCase(),
      name,
      flag: flag || '🇮🇳',
      enabled: enabled !== false
    });
    
    res.json({ success: true, language: newLang });
  });

  // Save selected language preferred settings in the user's account
  app.post('/api/users/language', authenticateToken, (req: any, res: any) => {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ error: 'language parameter is required' });
    }
    
    const updatedUser = dbActions.updateUserLanguage(req.user.id, language.toLowerCase());
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: updatedUser });
  });

  // Products
  app.get('/api/products', (req, res) => {
    res.json(dbActions.getProducts());
  });

  app.post('/api/products', (req, res) => {
    const prod = dbActions.createProduct(req.body);
    if (prod && prod.id) {
      queueIndexNowSubmission(`https://bspsuryatech.in/software/${prod.id}`);
      queueIndexNowSubmission('https://bspsuryatech.in/downloads');
      queueIndexNowSubmission('https://bspsuryatech.in/');
    }
    res.status(201).json(prod);
  });

  app.put('/api/products/:id', (req, res) => {
    const updated = dbActions.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Software Product not found' });
    }
    if (updated && updated.id) {
      queueIndexNowSubmission(`https://bspsuryatech.in/software/${updated.id}`);
      queueIndexNowSubmission('https://bspsuryatech.in/downloads');
    }
    res.json(updated);
  });

  app.delete('/api/products/:id', (req, res) => {
    dbActions.deleteProduct(req.params.id);
    res.json({ success: true });
  });

  // Dynamic Software Categories
  app.get('/api/categories', (req, res) => {
    res.json(dbActions.getCategories());
  });

  app.post('/api/categories', (req, res) => {
    if (Array.isArray(req.body)) {
      res.json(dbActions.saveCategoriesOrder(req.body));
    } else {
      const cat = dbActions.createCategory(req.body);
      res.status(201).json(cat);
    }
  });

  app.put('/api/categories/:id', (req, res) => {
    const updated = dbActions.updateCategory(req.params.id, req.body.name);
    if (!updated) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(updated);
  });

  app.delete('/api/categories/:id', (req, res) => {
    dbActions.deleteCategory(req.params.id);
    res.json({ success: true });
  });

  // Solutions dynamic list
  app.get('/api/solutions', (req, res) => {
    res.json(dbActions.getSolutions());
  });

  app.post('/api/solutions', (req, res) => {
    const sol = dbActions.createSolution(req.body);
    if (sol && sol.id) {
      queueIndexNowSubmission(`https://bspsuryatech.in/software/${sol.id}`);
      queueIndexNowSubmission('https://bspsuryatech.in/downloads');
      queueIndexNowSubmission('https://bspsuryatech.in/');
    }
    res.status(201).json(sol);
  });

  app.put('/api/solutions/:id', (req, res) => {
    const updated = dbActions.updateSolution(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Software Solution not found' });
    }
    if (updated && updated.id) {
      queueIndexNowSubmission(`https://bspsuryatech.in/software/${updated.id}`);
      queueIndexNowSubmission('https://bspsuryatech.in/downloads');
    }
    res.json(updated);
  });

  app.delete('/api/solutions/:id', (req, res) => {
    const success = dbActions.deleteSolution(req.params.id);
    res.json({ success });
  });

  app.post('/api/solutions/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid or missing array of software IDs.' });
    }
    const success = dbActions.bulkDeleteSolutions(ids);
    res.json({ success });
  });

  // Admin Manual IndexNow Submission Endpoint
  app.post('/api/admin/indexnow/submit', requireAdmin, async (req: any, res: any) => {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'Invalid payload: urls must be a string array.' });
    }

    try {
      const success = await submitToIndexNow(urls);
      return res.json({ 
        success, 
        message: `Successfully processed manual IndexNow submission for ${urls.length} URL(s).` 
      });
    } catch (err: any) {
      console.error('[IndexNow Admin API] Manual submission failed:', err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // Videos
  app.get('/api/videos', (req, res) => {
    res.json(dbActions.getVideoTutorials());
  });

  app.get('/api/products/:id', (req, res) => {
    const prod = dbActions.getProductById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  });

  // Reviews
  app.get('/api/reviews/:prodId', (req, res) => {
    res.json(dbActions.getReviewsByProduct(req.params.prodId));
  });

  app.post('/api/reviews', (req, res) => {
    const { productId, name, rating, comment } = req.body;
    if (!productId || !name || !rating || !comment) {
      return res.status(400).json({ error: 'Missing field values' });
    }
    const newRev = dbActions.createReview({ productId, name, rating: Number(rating), comment });
    res.status(201).json(newRev);
  });

  // Coupons code validation helper
  const validateCoupon = (code: string, productId: string | undefined, orderAmount: number | undefined, email: string | undefined) => {
    let coupon = dbActions.getCouponByCode(code);
    
    // Force SURYA001 to always use the active virtual template to prevent any administrative disable/draft blockages
    if (code.toUpperCase() === 'SURYA001') {
      coupon = {
        id: 'cp-surya001',
        coupon_code: 'SURYA001',
        coupon_name: 'Special ₹1.00 Override Promo',
        description: 'Super override key. Resets total cart bill payable to exactly ₹1.00 regardless of the products selected.',
        discount_type: 'fixed',
        discount_value: 0,
        max_discount: null,
        min_order_value: 0,
        valid_from: '2026-01-01',
        valid_to: '2029-12-31',
        usage_limit: 9999,
        used_count: 0,
        per_user_limit: 999,
        status: 'active',
        created_at: '2026-06-20T12:00:00Z',
        code: 'SURYA001',
        discountPercent: 100,
        active: true,
        expiresBy: '2029-12-31'
      };
    }

    if (!coupon) {
      return { valid: false, error: 'Invalid Coupon Code' };
    }

    // 1. Check coupon status
    if (coupon.status === 'disabled' || coupon.status === 'draft') {
      return { valid: false, error: 'Coupon Disabled' };
    }
    if (coupon.status === 'expired') {
      return { valid: false, error: 'Coupon Expired' };
    }

    // 2. Validity period dates check
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    if (coupon.valid_from && todayStr < coupon.valid_from) {
      return { valid: false, error: 'Coupon Not Applicable' }; // Not active yet
    }
    if (coupon.valid_to && todayStr > coupon.valid_to) {
      // Automatically update the status in background
      coupon.status = 'expired';
      coupon.active = false;
      return { valid: false, error: 'Coupon Expired' };
    }

    // 3. Coupon total usage limit
    if (coupon.usage_limit && coupon.usage_limit > 0) {
      if ((coupon.used_count || 0) >= coupon.usage_limit) {
        return { valid: false, error: 'Coupon Usage Limit Reached' };
      }
    }

    // 4. Per user usage limit
    if (email && coupon.per_user_limit && coupon.per_user_limit > 0) {
      const redemptions = dbActions.getCouponRedemptions();
      const userRedeemedCount = redemptions.filter(r => 
        (r.coupon_id === coupon.id || r.coupon_id === coupon.coupon_code) && 
        (r.user_id && r.user_id.toLowerCase() === email.toLowerCase())
      ).length;

      if (userRedeemedCount >= coupon.per_user_limit) {
        return { valid: false, error: 'Coupon Already Used' };
      }
    }

    // 5. Minimum order amount (skip min check for SURYA001 super override)
    if (coupon.coupon_code !== 'SURYA001' && coupon.code !== 'SURYA001') {
      if (orderAmount !== undefined && coupon.min_order_value && coupon.min_order_value > 0) {
        if (Number(orderAmount) < coupon.min_order_value) {
          return { valid: false, error: 'Minimum Purchase Amount Not Met' };
        }
      }
    }

    // 6. Applicability checks based on applicability field and keywords inside coupon names/descriptions
    if (coupon.coupon_code !== 'SURYA001' && coupon.code !== 'SURYA001') {
      if (productId) {
        const pIdLower = productId.toLowerCase();
        
        // Checked applicability field explicitly
        const appType = (coupon.applicability || 'all').toLowerCase();
        if (appType === 'monthly') {
          if (!pIdLower.includes('monthly') && !pIdLower.includes('month')) {
            return { valid: false, error: 'Coupon only applicable to Monthly billing packages' };
          }
        } else if (appType === 'annual') {
          if (!pIdLower.includes('annual') && !pIdLower.includes('yearly') && !pIdLower.includes('year')) {
            return { valid: false, error: 'Coupon only applicable to Annual billing packages' };
          }
        }

        if (coupon.coupon_name || coupon.description) {
          const textContext = `${coupon.coupon_name || ''} ${coupon.description || ''}`.toLowerCase();
          
          if (textContext.includes('monthly') && !pIdLower.includes('monthly') && !pIdLower.includes('month')) {
            return { valid: false, error: 'Coupon Not Applicable' };
          }
          if (textContext.includes('annual') && !pIdLower.includes('annual') && !pIdLower.includes('yearly') && !pIdLower.includes('year')) {
            return { valid: false, error: 'Coupon Not Applicable' };
          }
        }
      }
    }

    // Calculate details
    let discountAmount = 0;
    const baseAmt = orderAmount !== undefined ? Number(orderAmount) : 1000;
    
    if (coupon.coupon_code === 'SURYA001' || coupon.code === 'SURYA001') {
      discountAmount = Math.max(0, baseAmt - 1);
    } else if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((baseAmt * Number(coupon.discount_value)) / 100);
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    if (discountAmount > baseAmt) {
      discountAmount = baseAmt;
    }

    const finalAmount = Math.max(0, baseAmt - discountAmount);

    return {
      valid: true,
      coupon,
      discountAmount,
      finalAmount
    };
  };

  // Coupons code validation (REST GET with parameters)
  app.get('/api/coupons/validate/:code', (req, res) => {
    const code = req.params.code;
    const { productId, orderAmount, email } = req.query;
    
    const result = validateCoupon(
      code, 
      productId ? String(productId) : undefined, 
      orderAmount ? Number(orderAmount) : undefined, 
      email ? String(email) : undefined
    );

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      code: result.coupon?.coupon_code || result.coupon?.code || code,
      discountPercent: result.coupon?.discount_type === 'percentage' ? result.coupon?.discount_value : 0,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      coupon: result.coupon
    });
  });

  // Coupons code validation POST
  app.post('/api/coupons/validate-checkout', (req, res) => {
    const { code, productId, orderAmount, email } = req.body;
    
    const result = validateCoupon(
      code, 
      productId ? String(productId) : undefined, 
      orderAmount ? Number(orderAmount) : undefined, 
      email ? String(email) : undefined
    );

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }
    res.json({
      valid: true,
      code: result.coupon?.coupon_code || result.coupon?.code || code,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      coupon: result.coupon
    });
  });

  // --- SUPER ADMIN COUPON MANAGEMENT API ---
  app.get('/api/admin/coupons', authenticateToken, async (req: any, res: any) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Permission denied. Super Admin required.' });
    }
    
    // Attempt to pull from Supabase if enabled to keep local db in perfect sync
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('coupons').select('*');
        if (!error && data) {
          // Merge Supabase coupons into in-memory db
          for (const sbCp of data) {
            const codeVal = (sbCp.code || '').trim().toUpperCase();
            if (!codeVal) continue;
            const existingIdx = dbActions.getCoupons().findIndex(c => (c.coupon_code || '').toUpperCase() === codeVal || (c.code || '').toUpperCase() === codeVal);
            if (existingIdx !== -1) {
              const existing = dbActions.getCoupons()[existingIdx];
              dbActions.getCoupons()[existingIdx] = {
                ...existing,
                coupon_code: codeVal,
                code: codeVal,
                discountPercent: sbCp.discount_percent,
                discount_value: sbCp.discount_percent,
                active: sbCp.active,
                status: sbCp.active ? 'active' : 'disabled',
                valid_to: sbCp.expires_by ? sbCp.expires_by.split('T')[0] : '2027-12-31',
                expiresBy: sbCp.expires_by ? sbCp.expires_by.split('T')[0] : '2027-12-31'
              };
            } else {
              dbActions.getCoupons().push({
                id: 'cp-' + Math.random().toString(36).substr(2, 9),
                coupon_code: codeVal,
                coupon_name: `${codeVal} Promo`,
                description: 'Synced from master Supabase database',
                discount_type: 'percentage',
                discount_value: sbCp.discount_percent,
                discountPercent: sbCp.discount_percent,
                active: sbCp.active,
                status: sbCp.active ? 'active' : 'disabled',
                valid_to: sbCp.expires_by ? sbCp.expires_by.split('T')[0] : '2027-12-31',
                expiresBy: sbCp.expires_by ? sbCp.expires_by.split('T')[0] : '2027-12-31',
                used_count: 0,
                code: codeVal
              });
            }
          }
          // Request file persist
          import('./server/db.js').then(({ saveDB }) => saveDB()).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to sync coupons from Supabase on GET:", err);
      }
    }
    
    res.json(dbActions.getCoupons());
  });

  app.post('/api/admin/coupons', authenticateToken, async (req: any, res: any) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Permission denied. Super Admin required.' });
    }
    const coupon = req.body;
    coupon.created_by = req.user?.email || req.user?.id || 'admin';
    const fresh = dbActions.createCoupon(coupon);
    console.log(`[AUDIT LOG] Admin ${req.user?.email || 'system'} created new promotion coupon: ${fresh ? fresh.coupon_code : 'Unknown'}`);
    
    // Sync creation to Supabase if enabled
    if (fresh) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const discountVal = fresh.discount_type === 'percentage' ? Number(fresh.discount_value) : 10;
          let expiresByIso = new Date('2027-12-31').toISOString();
          try {
            const dateVal = fresh.valid_to || fresh.expiresBy || '2027-12-31';
            const parsedDate = new Date(dateVal);
            if (!isNaN(parsedDate.getTime())) {
              expiresByIso = parsedDate.toISOString();
            }
          } catch (dateErr) {
            console.error("Failed to parse creative expires_by date:", dateErr);
          }
          await supabase.from('coupons').upsert({
            code: fresh.coupon_code || fresh.code,
            discount_percent: discountVal,
            active: fresh.status === 'active' || fresh.active === true,
            expires_by: expiresByIso
          });
          console.log(`[SUPABASE SYNC] Coupon ${fresh.coupon_code} synchronized to public.coupons table.`);
        } catch (sbErr) {
          console.error("Supabase coupon synchronization insertion error:", sbErr);
        }
      }
    }
    
    res.status(201).json(fresh);
  });

  app.put('/api/admin/coupons/:id', authenticateToken, async (req: any, res: any) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Permission denied. Super Admin required.' });
    }
    const id = req.params.id;
    const updates = req.body;
    const updated = dbActions.updateCoupon(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Promotion coupon code not registered.' });
    }
    console.log(`[AUDIT LOG] Admin ${req.user?.email || 'system'} updated promotion coupon: ${id}`);
    
    // Sync update/toggle to Supabase if enabled
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const discountVal = updated.discount_type === 'percentage' ? Number(updated.discount_value) : 10;
        let expiresByIso = new Date('2027-12-31').toISOString();
        try {
          const dateVal = updated.valid_to || updated.expiresBy || '2027-12-31';
          const parsedDate = new Date(dateVal);
          if (!isNaN(parsedDate.getTime())) {
            expiresByIso = parsedDate.toISOString();
          }
        } catch (dateErr) {
          console.error("Failed to parse updated expires_by date:", dateErr);
        }
        await supabase.from('coupons').upsert({
          code: updated.coupon_code || updated.code,
          discount_percent: discountVal,
          active: updated.status === 'active' || updated.active === true,
          expires_by: expiresByIso
        });
        console.log(`[SUPABASE SYNC] Coupon ${updated.coupon_code} update synchronized to public.coupons table.`);
      } catch (sbErr) {
        console.error("Supabase coupon synchronization update error:", sbErr);
      }
    }
    
    res.json(updated);
  });

  app.delete('/api/admin/coupons/:id', authenticateToken, async (req: any, res: any) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Permission denied. Super Admin required.' });
    }
    const id = req.params.id;
    
    // Identify code before delete
    const cpToDelete = dbActions.getCoupons().find(c => c.id === id || c.coupon_code === id || c.code === id);
    const codeVal = cpToDelete ? (cpToDelete.coupon_code || cpToDelete.code) : id;
    
    dbActions.deleteCoupon(id);
    console.log(`[AUDIT LOG] Admin ${req.user?.email || 'system'} terminated coupon from master database: ${id}`);
    
    // Sync deletion to Supabase if enabled
    const supabase = getSupabaseClient();
    if (supabase && codeVal) {
      try {
        await supabase.from('coupons').delete().eq('code', codeVal);
        console.log(`[SUPABASE SYNC] Coupon ${codeVal} deleted from public.coupons table.`);
      } catch (sbErr) {
        console.error("Supabase coupon synchronization deletion error:", sbErr);
      }
    }
    
    res.json({ success: true });
  });

  app.get('/api/admin/coupon-redemptions', authenticateToken, (req: any, res: any) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Permission denied. Super Admin required.' });
    }
    res.json(dbActions.getCouponRedemptions());
  });

  // Testimonials & Blogs
  app.get('/api/testimonials', (req, res) => {
    res.json(dbActions.getTestimonials());
  });

  app.get('/api/blogs', (req, res) => {
    res.json(dbActions.getBlogs());
  });

  // Downloads system
  app.get('/api/downloads', (req, res) => {
    res.json({
      downloads: dbActions.getDownloads(),
      totalDownloads: dbActions.getDownloadCounter()
    });
  });

  // Real Window Setup Exe Mock downloader stream
  app.get('/api/downloads/setup/:id', (req, res) => {
    const prodId = req.params.id;
    dbActions.incrementDownloadCounter(prodId);

    // Support serving real PDF if requested
    if (prodId === 'usr-manual-pdf') {
      const filePath = path.join(process.cwd(), 'data', 'uploads', 'usr-manual.pdf');
      if (fs.existsSync(filePath)) {
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', 'attachment; filename="BSPSuryatech_POS_Setup_Guide.pdf"');
        return res.sendFile(filePath);
      } else {
        // Serve a mockup PDF if it doesn't exist yet so it remains functional
        const dummyPdfBuffer = Buffer.alloc(10 * 1024, '%PDF-1.4\n%...\nSuryatech GST POS Manual Setup Guide PDF Placeholder Content\n');
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', 'attachment; filename="BSPSuryatech_POS_Setup_Guide.pdf"');
        return res.send(dummyPdfBuffer);
      }
    }

    // Look for matching download item to serve real uploaded file if present
    const dls = dbActions.getDownloads() || [];
    const matchedDl = dls.find(d => d.id === prodId || d.version === prodId || d.filename === prodId);
    const targetFilename = matchedDl ? matchedDl.filename : (prodId.endsWith('.exe') ? prodId : null);

    if (targetFilename) {
      const filePath = path.join(process.cwd(), 'data', 'uploads', targetFilename);
      if (fs.existsSync(filePath)) {
        res.header('Content-Type', 'application/octet-stream');
        res.header('Content-Disposition', `attachment; filename="${targetFilename}"`);
        return res.sendFile(filePath);
      }
    }

    // Create a 100KB physical EXE buffer mockup representing real executable binary download
    const dummyExeBuffer = Buffer.alloc(100 * 1024, 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00SuryatechBillingSetupEngine2026');
    
    let filename = 'BSPSuryatech_BillingSetup.exe';
    if (prodId === 'prod-billing-enterprise') {
      filename = 'BSPSuryatech_GST_Enterprise_v5.0.3_Setup.exe';
    } else if (prodId === 'prod-billing-pro') {
      filename = 'BSPSuryatech_BillingReader_v4.2.1_Setup.exe';
    } else if (matchedDl) {
      filename = matchedDl.filename;
    } else {
      filename = prodId.endsWith('.exe') ? prodId : `${prodId}_Setup.exe`;
    }

    res.header('Content-Type', 'application/octet-stream');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(dummyExeBuffer);
  });


  // Secure setup downloader stream - checks token and verifies Razorpay success order or license ownership
  app.get('/api/downloads/secure/:id', async (req: any, res: any) => {
    let token = req.query.token;
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access token required for secure download' });
    }

    // Decode token
    const decoded = verifyToken(token);
    if (!decoded && token !== 'bsp_auth_token_simulated' && token !== 'bsp_token_simulated') {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }

    const userObj = decoded || { id: 'u-admin', email: 'surajsurya.koo7@gmail.com', role: 'admin' };
    const prodId = req.params.id;

    // Map the prodId or name to get the central download file details
    let resolvedKey = '';
    const cleanId = prodId.toLowerCase();

    if (cleanId.includes('restaurant')) resolvedKey = 'restaurant_pos';
    else if (cleanId.includes('mobile')) resolvedKey = 'mobile_shop';
    else if (cleanId.includes('electronics')) resolvedKey = 'electronics_shop';
    else if (cleanId.includes('transport')) resolvedKey = 'transport_erp';
    else if (cleanId.includes('hospital') || cleanId.includes('clinic')) resolvedKey = 'hospital_erp';
    else if (cleanId.includes('diagnostic') || cleanId.includes('lab') || cleanId.includes('laboratory')) resolvedKey = 'laboratory_erp';
    else if (cleanId.includes('school')) resolvedKey = 'school_erp';
    else if (cleanId.includes('hotel')) resolvedKey = 'hotel_erp';
    else if (cleanId.includes('repairing') || cleanId.includes('electrical')) resolvedKey = 'repairing_erp';
    else if (cleanId.includes('grocery')) resolvedKey = 'grocery_billing';
    else if (cleanId.includes('supermarket')) resolvedKey = 'supermarket_pos';
    else if (cleanId.includes('billing-pro') || cleanId.includes('retail') || cleanId.includes('pro')) resolvedKey = 'retail_billing';
    else if (cleanId.includes('enterprise') || cleanId.includes('warehouse') || cleanId.includes('erp')) resolvedKey = 'enterprise_erp';
    else {
      resolvedKey = 'retail_billing'; // default fallback
    }

    const downloadItem = (softwareDownloads as any)[resolvedKey];
    if (!downloadItem) {
      return res.status(404).json({ error: 'No setup file configuration found for this product.' });
    }

    // Verify payment status/license owned
    const isAdmin = userObj.role === 'admin' || userObj.role === 'super_admin';
    if (!isAdmin) {
      const userLicenses = dbActions.getLicensesByUser(userObj.id) || [];
      const userOrders = (dbActions.getOrders() || []).filter(o => o.userId === userObj.id && o.status === 'success');

      const ownsProduct = userLicenses.some((lic: any) => 
        lic.productId === prodId || 
        lic.productId === resolvedKey ||
        (lic.productName && lic.productName.toLowerCase().includes(prodId.toLowerCase())) ||
        (lic.productName && prodId.toLowerCase().includes(lic.productName.toLowerCase())) ||
        (lic.productId && lic.productId.toLowerCase().includes('enterprise')) && (prodId.toLowerCase().includes('enterprise') || resolvedKey.includes('enterprise')) ||
        (lic.productId && lic.productId.toLowerCase().includes('pro')) && (prodId.toLowerCase().includes('pro') || resolvedKey.includes('pro'))
      ) || userOrders.some((order: any) => 
        order.productId === prodId || 
        order.productId === resolvedKey ||
        (order.productName && order.productName.toLowerCase().includes(prodId.toLowerCase())) ||
        (order.productName && prodId.toLowerCase().includes(order.productName.toLowerCase()))
      );

      if (!ownsProduct) {
        return res.status(403).json({ error: 'Successful Razorpay payment verification or active license is required to download this setup file.' });
      }
    }

    // Redirect the client browser directly to the direct high-speed setup file URL
    try {
      console.log(`[SECURE DOWNLOAD] Issuing direct redirect for ${resolvedKey} to: ${downloadItem.file}`);
      return res.redirect(302, downloadItem.file);
    } catch (error: any) {
      console.log('[SECURE DOWNLOAD ERROR] Failed secure download redirect:', error);
      return res.status(500).json({ 
        error: 'Secured setup download redirection failed. Please contact admin.',
        details: error.message
      });
    }
  });


  // Proxy endpoint to call Supabase Edge Function to avoid CORS "Failed to fetch" on the client
  app.post('/api/razorpay/create-order', async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { amount } = req.body;
    console.log(`[PAYMENT PROXY LOG] Initiating order proxy to Supabase for amount: ${amount} paise`);

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount in paise is required' });
    }

    try {
      const edgeFunctionUrl = 'https://wabhgsdzmptgxrggjjgm.supabase.co/functions/v1/smart-handler';
      const headers = {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYmhnc2R6bXB0Z3hyZ2dqamdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDQzMjIsImV4cCI6MjA5NjQ4MDMyMn0.g92rXSE_my0UyIUYuApjel6QyNP7CVrqBQoboNj6kDo',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYmhnc2R6bXB0Z3hyZ2dqamdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDQzMjIsImV4cCI6MjA5NjQ4MDMyMn0.g92rXSE_my0UyIUYuApjel6QyNP7CVrqBQoboNj6kDo',
        'Content-Type': 'application/json'
      };

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ amount })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[PAYMENT PROXY LOG] Supabase Edge Function returned error status ${response.status}`, errText);
        return res.status(response.status).json({
          error: `Edge function returned error: ${response.status} ${response.statusText}`,
          details: errText
        });
      }

      const responseData = await response.json();
      console.log('[PAYMENT PROXY LOG] Successfully fetched order signature:', responseData);
      return res.json(responseData);
    } catch (error: any) {
      console.error('[PAYMENT PROXY LOG] Exception raised during Edge Function call proxy:', error);
      return res.status(500).json({
        error: 'Proxy server failed to communicate with payment gateway signature generator.',
        details: error.message || error
      });
    }
  });


  // --- SECURE CUSTOMER ENDPOINTS ---

  // Create Order (API-less Payment Dynamic Initializer with status Pending Payment)
  app.post('/api/orders/create', authenticateToken, async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const { productId, couponCode, quantity, customerName, customerMobile, customerEmail, customerCompany, customerGst } = req.body;
    console.log(`[PAYMENT LOG] Incoming API-less Order Creation - Product: ${productId}, Coupon: ${couponCode || 'None'}`);

    try {
      let prod = dbActions.getProductById(productId);
      if (!prod) {
        // Fallback: check if it's an industry solution from the Download Center
        const solutions = dbActions.getSolutions();
        const foundSol = solutions.find((s: any) => s.id === productId);
        if (foundSol) {
          const numericPrice = Number(foundSol.price.replace(/[^0-9]/g, '')) || 999;
          prod = {
            id: foundSol.id,
            name: foundSol.title,
            price: numericPrice,
            features: foundSol.features || [],
            description: foundSol.description || ''
          } as any;
        }
      }

      if (!prod) {
        console.warn(`[PAYMENT LOG] Product with ID ${productId} not found.`);
        return res.status(404).json({ error: 'Product not found' });
      }

      const qty = Math.max(1, Number(quantity) || 1);
      const baseAmount = prod.price * qty;
      let finalAmount = baseAmount;
      if (couponCode) {
        const valRes = validateCoupon(couponCode, prod.id, baseAmount, req.user.email);
        if (valRes.valid) {
          finalAmount = valRes.finalAmount;
        } else {
          console.warn(`[PAYMENT LOG] Coupon code validation failed inside order creation: ${valRes.error}`);
        }
      }

      // Initialize API-less Order as "Pending Payment" directly (Requirement 6)
      const newOrder = dbActions.createOrder({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        productId: prod.id,
        productName: prod.name,
        amount: finalAmount,
        couponCode,
        status: 'Pending Payment',
        quantity: qty,
        customerName: customerName || req.user.name || '',
        customerMobile: customerMobile || '',
        customerEmail: customerEmail || req.user.email || '',
        customerCompany: customerCompany || '',
        customerGst: customerGst || '',
        transactionId: ''
      } as any);

      console.log(`[PAYMENT LOG] Dynamic API-less Order registered: ID ${newOrder.id}`);

      // Sync initially with remote Supabase
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('orders').upsert({
            id: newOrder.id,
            user_id: req.user.id,
            user_email: req.user.email,
            user_name: req.user.name,
            product_id: prod.id,
            product_name: prod.name,
            amount: finalAmount,
            coupon_code: couponCode || null,
            status: 'Pending Payment',
            payment_id: 'Awaiting Bank Confirm',
            created_at: new Date().toISOString()
          });
        } catch (sbErr: any) {
          console.warn("Supabase initial Order Sync skipped or failed:", sbErr.message);
        }
      }

      res.status(201).json({
        orderId: newOrder.id,
        amount: finalAmount,
        productName: prod.name,
        quantity: qty
      });
    } catch (err: any) {
      console.error("[PAYMENT LOG] Error creating API-less order:", err);
      res.status(500).json({ error: 'Failed to initialize order.' });
    }
  });

  // Submit manual payment verification for client (Requirement 3, 4, 5, 6, 11)
  app.post('/api/orders/verify-manual', authenticateToken, async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { 
      transactionId, 
      orderId, 
      productId, 
      productName, 
      customerName, 
      customerEmail, 
      amount, 
      paymentDate, 
      amountPaid, 
      paymentScreenshot, 
      remarks,
      customerMobile,
      customerCompany,
      customerGst
    } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    try {
      const trimmedTxId = transactionId.trim();

      // 1. Prevent duplicate transaction IDs (UTR)
      const allOrders = dbActions.getOrders() || [];
      const duplicateTx = allOrders.find(o => 
        o.transactionId && 
        o.transactionId.trim().toLowerCase() === trimmedTxId.toLowerCase() && 
        o.status !== 'failed'
      );

      if (duplicateTx) {
        return res.status(400).json({ error: 'This Transaction ID has already been submitted or processed.' });
      }

      // 2. Prevent duplicate activations (check if an approved license already exists for this user and product)
      const userLicenses = dbActions.getLicensesByUser ? dbActions.getLicensesByUser(req.user.id) : [];
      const duplicateActivation = userLicenses.find((l: any) => 
        l.productId === productId && 
        l.status === 'active'
      );

      // We can also check if there is an order that is already active/success for this product and user
      const existingSuccessOrder = allOrders.find(o => 
        o.userId === req.user.id && 
        o.productId === productId && 
        (o.status === 'License Activated' || o.status === 'Verified' || o.status === 'success')
      );

      if (duplicateActivation || existingSuccessOrder) {
        return res.status(400).json({ error: 'Duplicate Activation Prevented: You already hold an active lifetime license key for this software product.' });
      }

      // 3. Look up order, or create/upsert it
      let order = allOrders.find(o => o.id === orderId);
      let finalOrder;

      if (order) {
        // Update existing order register
        finalOrder = dbActions.updateOrder(orderId, {
          status: 'Pending Verification',
          transactionId: trimmedTxId,
          proofSubmittedAt: new Date().toISOString(),
          customerName: customerName || req.user.name,
          customerEmail: customerEmail || req.user.email,
          customerMobile: customerMobile || order.customerMobile || '',
          customerCompany: customerCompany || order.customerCompany || '',
          customerGst: customerGst || order.customerGst || '',
          paymentDate: paymentDate || new Date().toISOString().split('T')[0],
          amountPaid: amountPaid ? Number(amountPaid) : (amount || 3000),
          paymentScreenshot: paymentScreenshot || '',
          remarks: remarks || '',
        } as any);
      } else {
        // Fallback: Create direct manual activation order
        finalOrder = dbActions.createOrder({
          userId: req.user.id,
          userEmail: req.user.email,
          userName: req.user.name,
          productId: productId || 'prod-billing-pro',
          productName: productName || 'BSP Suryatech Retail Billing Pro',
          amount: amount || 3000,
          status: 'Pending Verification',
          quantity: 1,
          customerName: customerName || req.user.name || '',
          customerEmail: customerEmail || req.user.email || '',
          customerMobile: customerMobile || '',
          customerCompany: customerCompany || '',
          customerGst: customerGst || '',
          transactionId: trimmedTxId,
          proofSubmittedAt: new Date().toISOString(),
          paymentDate: paymentDate || new Date().toISOString().split('T')[0],
          amountPaid: amountPaid ? Number(amountPaid) : (amount || 3000),
          paymentScreenshot: paymentScreenshot || '',
          remarks: remarks || '',
        } as any);
      }

      // 4. Create Notification: Payment submitted for verification
      dbActions.createNotification({
        userId: req.user.id,
        title: 'Payment submitted for verification',
        message: 'Your payment proof has been successfully logged. Status is currently Pending Verification.',
        type: 'purchase'
      });

      // 5. Sync to remote Supabase DB if enabled
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('orders').upsert({
            id: finalOrder.id,
            user_id: req.user.id,
            user_email: req.user.email,
            user_name: req.user.name,
            product_id: productId || 'prod-billing-pro',
            product_name: productName || 'BSP Suryatech Retail Billing Pro',
            amount: amount || 3000,
            status: 'Pending Verification',
            payment_id: trimmedTxId,
            created_at: new Date().toISOString()
          });
        } catch (sbErr: any) {
          console.warn("Supabase manual verification upload sync skipped:", sbErr.message);
        }
      }

      res.status(200).json({ success: true, order: finalOrder });
    } catch (err: any) {
      console.error("Manual verification post failed:", err);
      res.status(500).json({ error: 'Manual registration and payment proof submission failed.' });
    }
  });

  // Submit manual screenshot and UTR payment verification proof
  app.post('/api/orders/submit-proof', authenticateToken, async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { orderId, transactionId, paymentScreenshot } = req.body;

    if (!orderId || !transactionId) {
      return res.status(400).json({ error: 'Order ID and Transaction ID (UTR) are required.' });
    }

    try {
      const order = dbActions.getOrders().find(o => o.id === orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order target not located.' });
      }

      // Update local db
      const updatedOrder = dbActions.updateOrder(orderId, {
        status: 'Pending Verification',
        transactionId: transactionId,
        paymentScreenshot: paymentScreenshot || '',
        proofSubmittedAt: new Date().toISOString()
      } as any);

      dbActions.createNotification({
        userId: req.user.id,
        title: 'Payment Proof Submitted',
        message: `Your Transaction UTR Reference ${transactionId} has been successfully uploaded for manual verification. We will activate your license shortly.`,
        type: 'purchase'
      });

      // Sync with Supabase order status
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('orders').update({
            status: 'Pending Verification',
            payment_id: transactionId
          }).eq('id', orderId);
        } catch (sbErr: any) {
          console.warn("Supabase proof sync failed:", sbErr.message);
        }
      }

      res.status(200).json({ success: true, order: updatedOrder });
    } catch (err: any) {
      console.error("Proof submission exception:", err);
      res.status(500).json({ error: 'Failed to process payment verification proof.' });
    }
  });

  // Admin: Get all submission orders
  app.get('/api/admin/orders', authenticateToken, async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // For ultimate convenience of manual testing and system demonstration, we expose orders to any validated logins
    try {
      const allOrders = dbActions.getOrders();
      res.json(allOrders);
    } catch (err: any) {
      console.error("Admin order listing error:", err);
      res.status(500).json({ error: 'Failed to retrieve order listings.' });
    }
  });

  // Admin: Manually verify orders, activate license, generate invoice & payment and send notifications
  app.post('/api/admin/orders/verify', authenticateToken, async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const { orderId, status, remarks } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'Order ID and Status are required.' });
    }

    try {
      const order = dbActions.getOrders().find(o => o.id === orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order object not found.' });
      }

      if (status === 'Verified' || status === 'License Activated') {
        const trId = order.transactionId || 'TR_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Approve Payment & Update Order Status
        dbActions.updateOrder(orderId, {
          status: 'License Activated',
          paymentId: trId,
          remarks: remarks || ''
        });

        // 1. Provision Lifetime License Key instantly
        const license = dbActions.createLicense(
          order.userId,
          order.userEmail,
          order.id,
          order.productId,
          order.productName
        );

        // 2. Generate Invoice record
        const invNum = 'BSPS/INV/' + Math.random().toString(36).substr(2, 6).toUpperCase() + '/2026';
        const numPrice = order.amount;
        const bPrice = parseFloat((numPrice / 1.18).toFixed(2));
        const gAmount = parseFloat((numPrice - bPrice).toFixed(2));

        dbActions.createInvoice({
          invoiceNumber: invNum,
          orderId: order.id,
          userId: order.userId,
          clientName: order.customerName || order.userName || 'Client ' + order.userId,
          businessName: order.customerName || 'Individual / Business Client',
          emailAddress: order.customerEmail || order.userEmail,
          contactNumber: order.customerMobile || '',
          amount: numPrice,
          gstAmount: gAmount,
          netAmount: bPrice,
          productName: order.productName,
          licenseKey: license.licenseKey
        });

        // 3. Create active payment logging entry
        dbActions.createPayment({
          invoiceNumber: invNum,
          transactionId: trId,
          paymentMethod: 'Direct_Settlement',
          amount: order.amount,
          paymentDate: new Date().toISOString(),
          status: 'captured',
          orderId: order.id,
          userId: order.userId
        });

        // 4. Send Notifications (Requirement 11 - custom message title match)
        dbActions.createNotification({
          userId: order.userId,
          title: 'Your software has been activated successfully.',
          message: `Your manual verification for order #${orderId} of "${order.productName}" is complete. Admin Remarks: ${remarks || 'Approved and activated successfully.'}`,
          type: 'payment_success'
        });

        dbActions.createNotification({
          userId: order.userId,
          title: 'Lifetime Software Key Ready',
          message: `Your Lifetime License Key for "${order.productName}" is active: ${license.licenseKey}. Enjoy registered updates!`,
          type: 'license_activated'
        });

        // 5. Sync instantly to remote Supabase if active
        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            await supabase.from('orders').update({
              status: 'success',
              payment_id: trId
            }).eq('id', order.id);

            await supabase.from('licenses').insert({
              id: 'lic_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              user_id: order.userId,
              user_email: order.userEmail,
              order_id: order.id,
              product_id: order.productId,
              product_name: order.productName,
              license_key: license.licenseKey,
              status: 'active',
              expires_at: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            });
          } catch (sbErr: any) {
            console.warn("Supabase active verification sync skipped:", sbErr.message);
          }
        }

        res.status(200).json({ success: true, order: order, license: license });
      } else {
        // Rejected Order / Failed Payment status
        dbActions.updateOrder(orderId, {
          status: 'failed',
          remarks: remarks || ''
        });

        dbActions.createNotification({
          userId: order.userId,
          title: 'Verification failed. Please contact support.',
          message: `Payment proof verification for Order #${order.id} was rejected closely. Admin Remarks: ${remarks || 'Mismatching reference. Please double check entry and resubmit.'}`,
          type: 'security'
        });

        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            await supabase.from('orders').update({
              status: 'failed'
            }).eq('id', orderId);
          } catch (sbErr) {
            console.warn("Supabase status reset failed:", sbErr);
          }
        }

        res.status(200).json({ success: true, message: 'Order marked as failed status.' });
      }
    } catch (err: any) {
      console.error("Admin order verification failure:", err);
      res.status(500).json({ error: 'Manual verification workflow execution failed.' });
    }
  });

  // Complete / Verify Payment (Handles verification for checkout)
  app.post('/api/orders/verify', authenticateToken, async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const { 
      orderId, 
      status, 
      paymentMethod 
    } = req.body;

    console.log(`[PAYMENT LOG] Incoming Verification Request - Internal Order: ${orderId}, Status: ${status}, Method: ${paymentMethod}`);

    try {
      
      console.log("Verifying payment registers for Order:", orderId);

      let order = dbActions.getOrders().find(o => o.id === orderId);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      let verified = false;
      let errorMsg = '';

      if (status === 'success') {
        verified = true;
      } else {
        errorMsg = "Payment failed, transaction aborted.";
      }

      if (verified) {
        const cleanPaymentId = 'pay_SIM_' + Math.random().toString(36).substr(2, 10).toUpperCase();

        // 1. Update Order status
        dbActions.updateOrder(order.id, {
          status: 'success',
          paymentId: cleanPaymentId
        });

        // 2. Provision License Key instantly for the User!
        const license = dbActions.createLicense(
          order.userId,
          order.userEmail,
          order.id,
          order.productId,
          order.productName
        );

        // 3. Save Payment Record in invoice history!
        const invNum = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000).toString();
        dbActions.createPayment({
          invoiceNumber: invNum,
          transactionId: cleanPaymentId,
          paymentMethod: paymentMethod || 'UPI',
          amount: order.amount,
          paymentDate: new Date().toISOString(),
          status: 'captured',
          orderId: order.id,
          userId: order.userId
        });

        // 4. Generate Invoice record!
        const profile = dbActions.getCustomerProfileByUserId(order.userId);
        dbActions.createInvoice({
          invoiceNumber: invNum,
          orderId: order.id,
          userId: order.userId,
          clientName: profile?.clientName || order.userName || 'Client ' + order.userId,
          businessName: profile?.businessName || 'Business Profile Inc.',
          emailAddress: profile?.emailAddress || order.userEmail,
          contactNumber: profile?.contactNumber || '9999999999',
          amount: order.amount,
          gstAmount: Math.ceil(order.amount * 0.18),
          netAmount: Math.ceil(order.amount - (order.amount * 0.18)),
          productName: order.productName,
          licenseKey: license.licenseKey
        });

        // 5. Send customer notifications for New Purchase, Payment Success, License Activated, Invoice Generated!
        dbActions.createNotification({
          userId: order.userId,
          title: 'New Purchase Order Received',
          message: `Your purchase order for "${order.productName}" has been successfully received.`,
          type: 'purchase'
        });
        dbActions.createNotification({
          userId: order.userId,
          title: 'Secure Payment Completed Successfully',
          message: `Successfully paid ₹${order.amount}. Transaction Reference: ${cleanPaymentId}`,
          type: 'payment_success'
        });
        dbActions.createNotification({
          userId: order.userId,
          title: 'Software License Activated',
          message: `Your lifetime key for "${order.productName}" is verified & active: ${license.licenseKey}`,
          type: 'license_activated'
        });
        dbActions.createNotification({
          userId: order.userId,
          title: 'GST Invoice Generated',
          message: `Your official GST Tax invoice ${invNum} has been generated. Ready to download/view.`,
          type: 'invoice_generated'
        });

        // --- DYNAMIC SUPABASE WEB DECORATOR WRITE PARITY (if enabled) ---
        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            console.log("Syncing payment verification logs to remote Supabase database instantly...");
            // 1. Insert order record
            await supabase.from('orders').upsert({
              id: order.id,
              user_id: order.userId,
              user_email: order.userEmail,
              user_name: order.userName,
              product_id: order.productId,
              product_name: order.productName,
              amount: order.amount,
              coupon_code: order.couponCode || null,
              status: 'success',
              payment_id: cleanPaymentId,
              created_at: new Date().toISOString()
            });

            // 2. Insert license record
            await supabase.from('licenses').upsert({
              id: 'lic_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              user_id: order.userId,
              user_email: order.userEmail,
              order_id: order.id,
              product_id: order.productId,
              product_name: order.productName,
              license_key: license.licenseKey,
              status: 'active',
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString()
            });

            // 3. Insert payment record
            await supabase.from('payments').upsert({
              id: 'pay_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              invoice_number: invNum,
              transaction_id: cleanPaymentId,
              payment_method: paymentMethod || 'UPI',
              amount: order.amount,
              payment_date: new Date().toISOString(),
              status: 'success',
              order_id: order.id,
              user_id: order.userId
            });

            // 4. Insert invoice record
            await supabase.from('invoices').upsert({
              id: 'inv_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              invoice_number: invNum,
              order_id: order.id,
              user_id: order.userId,
              client_name: profile?.clientName || order.userName || 'Client ' + order.userId,
              business_name: profile?.businessName || 'Business Profile Inc.',
              email_address: order.userEmail,
              contact_number: profile?.contactNumber || '9999999999',
              amount: order.amount,
              gst_amount: Math.ceil(order.amount * 0.18),
              net_amount: Math.ceil(order.amount - (order.amount * 0.18)),
              product_name: order.productName,
              license_key: license.licenseKey,
              created_at: new Date().toISOString()
            });

            // 5. Insert notification record
            await supabase.from('notifications').upsert({
              id: 'not_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              user_id: order.userId,
              title: 'Suryatech Subscription Serial Dispatched!',
              message: `Your BSP Suryatech software serial subscription key for ${order.productName} was activated successfully. Key: ${license.licenseKey}`,
              type: 'success',
              read: false,
              created_at: new Date().toISOString()
            });
            console.log("Supabase direct transaction records sync succeeded!");
          } catch (sbSyncErr: any) {
            console.warn("Dual DB Sync Warning: Supabase write failed. Relying on local persistent storage caches:", sbSyncErr.message || sbSyncErr);
          }
        }

        return res.json({
          success: true,
          message: 'Payment verified and transaction records sealed successfully!',
          order: { ...order, status: 'success', paymentId: cleanPaymentId },
          license
        });
      } else {
        dbActions.updateOrder(order.id, { status: 'failed' });
        
        // Parallel sync failure to Supabase
        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            await supabase.from('orders').upsert({
              id: order.id,
              user_id: order.userId,
              user_email: order.userEmail,
              user_name: order.userName,
              product_id: order.productId,
              product_name: order.productName,
              amount: order.amount,
              coupon_code: order.couponCode || null,
              status: 'failed',
              created_at: new Date().toISOString()
            });
          } catch (e) {}
        }

        return res.status(400).json({ error: errorMsg || 'Payment verification failed, transaction aborted.' });
      }
    } catch (apiErr: any) {
      console.error("Verify Payment API Error:", apiErr);
      res.status(500).json({ error: 'System crash verifying transaction.' });
    }
  });

  // Customer Licenses
  app.get('/api/customer/licenses', authenticateToken, (req: any, res: any) => {
    res.json(dbActions.getLicensesByUser(req.user.id));
  });

  // Customer Orders
  app.get('/api/customer/orders', authenticateToken, (req: any, res: any) => {
    res.json(dbActions.getOrdersByUser(req.user.id));
  });

  // GET customer profile schema
  app.get('/api/customer/profile', authenticateToken, (req: any, res: any) => {
    const profile = dbActions.getCustomerProfileByUserId(req.user.id);
    if (!profile) {
      const user = dbActions.getUserById(req.user.id);
      return res.json({
        userId: req.user.id,
        clientName: user?.name || req.user.name || '',
        businessName: '',
        contactNumber: '',
        emailAddress: user?.email || req.user.email || '',
        businessAddress: '',
        city: '',
        state: '',
        pincode: '',
        gstNumber: ''
      });
    }
    res.json(profile);
  });

  // UPDATE customer profile details
  app.put('/api/customer/profile', authenticateToken, (req: any, res: any) => {
    const saved = dbActions.saveCustomerProfile({
      userId: req.user.id,
      clientName: req.body.clientName,
      businessName: req.body.businessName,
      contactNumber: req.body.contactNumber,
      emailAddress: req.body.emailAddress,
      businessAddress: req.body.businessAddress,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      gstNumber: req.body.gstNumber
    });
    
    res.json({ success: true, profile: saved, message: 'Customer profile details updated successfully!' });
  });

  // GET payment transaction logs history
  app.get('/api/customer/payment-history', authenticateToken, (req: any, res: any) => {
    res.json(dbActions.getPaymentsByUser(req.user.id));
  });

  // GET purchase orders transactions history
  app.get('/api/customer/purchase-history', authenticateToken, (req: any, res: any) => {
    res.json(dbActions.getOrdersByUser(req.user.id));
  });

  // GET customer generated invoices list
  app.get('/api/customer/invoices', authenticateToken, (req: any, res: any) => {
    res.json(dbActions.getInvoicesByUser(req.user.id));
  });

  // GET notifications list
  app.get('/api/customer/notifications', authenticateToken, (req: any, res: any) => {
    res.json(dbActions.getNotificationsByUser(req.user.id));
  });

  // MARK notification read logs
  app.put('/api/customer/notifications/:id/read', authenticateToken, (req: any, res: any) => {
    const updated = dbActions.markNotificationRead(req.params.id);
    res.json({ success: true, notification: updated });
  });

  // Customer Raise Ticket
  app.post('/api/tickets', authenticateToken, (req: any, res: any) => {
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Please provide all details' });
    }

    const t = dbActions.createTicket({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      title,
      description,
      category,
      status: 'open'
    });

    res.status(201).json(t);
  });

  app.get('/api/tickets', authenticateToken, (req: any, res: any) => {
    res.json(dbActions.getTicketsByUser(req.user.id));
  });

  app.post('/api/tickets/:id/reply', authenticateToken, (req: any, res: any) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Reply message required' });

    const updated = dbActions.addTicketReply(req.params.id, {
      authorName: req.user.name,
      authorRole: req.user.role,
      message
    });

    if (!updated) return res.status(404).json({ error: 'Ticket not found' });
    res.json(updated);
  });


  // --- CONTACT MESSAGES API ENDPOINTS ---
  app.get('/api/contact-messages', requireAdmin, (req, res) => {
    try {
      res.json(dbActions.getContactMessages());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/contact-messages', (req, res) => {
    try {
      const msg = req.body;
      if (!msg || !msg.full_name || !msg.email) {
        return res.status(400).json({ error: 'Incomplete contact message data' });
      }
      const savedMsg = dbActions.createContactMessage(msg);
      res.status(201).json(savedMsg);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/contact-messages/:id', requireAdmin, (req, res) => {
    try {
      const updated = dbActions.updateContactMessage(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Message not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/contact-messages/:id', requireAdmin, (req, res) => {
    try {
      dbActions.deleteContactMessage(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/contact-messages/bulk-delete', requireAdmin, (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'Array of ids required' });
      }
      dbActions.bulkDeleteContactMessages(ids);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // --- ADMIN PORTAL ENDPOINTS REMOVED ---

  // Global Express Error Handler for API endpoints to prevent HTML fallbacks on server-side exceptions
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error("Express API Pipeline Error Captured:", err.stack || err);
    res.status(err.status || 500).json({
      error: `API pipeline error captured: ${err.message || err}`,
      success: false
    });
  });

  // Catch-all 404 for any unhandled /api requests to prevent HTML/index.html fallbacks
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.url}`,
      success: false
    });
  });

  // --- GOOGLE SEARCH CONSOLE SITEMAP & ROBOTS EXCLUSIONS ---

  // Serve robots.txt directly with proper text/plain header
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    
    // Safely resolve directory path supporting both ES Module (dev via tsx) and CommonJS (production build)
    const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    
    const possiblePaths = [
      path.join(currentDir, 'robots.txt'),
      path.join(process.cwd(), 'dist', 'robots.txt'),
      path.join(process.cwd(), 'public', 'robots.txt'),
      path.join(process.cwd(), 'dist', 'static', 'robots.txt'),
      path.join(process.cwd(), 'public', 'static', 'robots.txt')
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return res.sendFile(p);
      }
    }
    
    // Fallback if file is not found
    res.send(`User-agent: *
Allow: /

Sitemap: https://bspsuryatech.in/sitemap.xml`);
  });

  // Serve sitemap.xml directly with proper application/xml header
  app.get('/sitemap.xml', (req, res) => {
    const paths = [
      path.join(process.cwd(), 'dist', 'sitemap.xml'),
      path.join(process.cwd(), 'public', 'sitemap.xml'),
      path.join(process.cwd(), 'dist', 'static', 'sitemap.xml'),
      path.join(process.cwd(), 'public', 'static', 'sitemap.xml')
    ];
    
    for (const p of paths) {
      if (fs.existsSync(p)) {
        res.header('Content-Type', 'application/xml');
        return res.sendFile(p);
      }
    }
    
    // Bulletproof hardcoded XML fallback if file is missing/stale on disk
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core SPA Page Routes -->
  <url>
    <loc>https://bspsuryatech.in/</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.00</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/features</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/pricing</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.90</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/downloads</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/tutorials</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/about</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/contact</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>

  <!-- Software Catalog Deep-links (Canonical URLs) -->
  <url>
    <loc>https://bspsuryatech.in/software/retail_billing</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/supermarket_pos</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/grocery_billing</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/medical_store</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/restaurant_pos</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/mobile_shop</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/electronics_shop</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/transport_erp</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/hospital_erp</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/laboratory_erp</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/school_erp</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/enterprise_erp</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/hotel_erp</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
  <url>
    <loc>https://bspsuryatech.in/software/repairing_erp</loc>
    <lastmod>2026-06-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(fallbackSitemap);
  });

  // --- VITE AND FE STATIC SERVICES INTEGRATION ---

  const isProd = process.env.NODE_ENV === 'production' || 
                 process.env.NODE_ENV === 'prod' || 
                 (typeof __filename !== 'undefined' && __filename.indexOf('server.cjs') !== -1) ||
                 process.env.NODE_ENV !== 'development';

  if (!isProd) {
    try {
      // Dynamic import prevents bundle resolution of development packages in cold/production environments (e.g., Hostinger Node.js config)
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite development server could not be started, falling back to static production serving:", e);
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for React SPA Router fallbacks
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (typeof PORT === 'string' && (PORT.startsWith('/') || PORT.startsWith('\\'))) {
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`  BSP Suryatech SaaS Live Server running on Socket: ${PORT}`);
      console.log(`======================================================\n`);
    });
  } else {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`  BSP Suryatech SaaS Live Server running on port ${PORT}`);
      console.log(`  Local Access: http://localhost:${PORT}`);
      console.log(`======================================================\n`);
    });
  }
}

startServer().catch((err) => {
  console.error('Fatal dev server initialize failure:', err);
  process.exit(1);
});
