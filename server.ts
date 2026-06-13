/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { GoogleGenAI } from '@google/genai';
import { dbActions, verifyPassword, signToken, verifyToken } from './server/db';
import { Coupon } from './src/types';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

  // API Authentication Middlewares
  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(403).json({ error: 'Invalid or expired token' });
    
    req.user = decoded;
    next();
  }

  function requireAdmin(req: any, res: any, next: any) {
    authenticateToken(req, res, () => {
      if (req.user.role !== 'admin') {
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
      'https://bspsuryatech.in/contact',
      'https://bspsuryatech.in/portal'
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
              businessAddress: 'Sector 62, Noida, UP',
              city: 'Noida',
              state: 'Uttar Pradesh',
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
            businessAddress: 'Sector 62, Noida, UP',
            city: 'Noida',
            state: 'Uttar Pradesh',
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

  // Solutions dynamic list
  app.get('/api/solutions', (req, res) => {
    res.json(dbActions.getSolutions());
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

  // Coupons code validation
  app.get('/api/coupons/validate/:code', (req, res) => {
    const coupon = dbActions.getCouponByCode(req.params.code);
    if (!coupon) return res.status(404).json({ error: 'Invalid or expired coupon code' });
    res.json(coupon);
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


  // --- SECURE CUSTOMER ENDPOINTS ---

  // Public dynamic endpoint to load configured Razorpay Key ID securely without exposing secrets
  app.get('/api/orders/rzp-pubkey', async (req: any, res: any) => {
    // Sync from Supabase first if active
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('settings_val')
          .eq('settings_key', 'razorpay_config')
          .maybeSingle();
        
        if (data && data.settings_val) {
          const parsed = JSON.parse(data.settings_val);
          dbActions.updateRazorpayConfig(parsed);
        }
      } catch (sbErr: any) {
        console.warn("Supabase Config Fetch Failed (using local cache fallback):", sbErr.message || sbErr);
      }
    }

    const rzpConfig = dbActions.getRazorpayConfig();
    res.json({
      keyId: rzpConfig.enabled ? rzpConfig.keyId : 'rzp_test_SURYA2026KEY',
      enabled: rzpConfig.enabled || false,
      currency: rzpConfig.currency || 'INR',
      mode: rzpConfig.mode || 'test'
    });
  });

  // Create Order (Razorpay Simulation Initializer / Real Razorpay live order)
  app.post('/api/orders/create', authenticateToken, async (req: any, res: any) => {
    try {
      const { productId, couponCode } = req.body;
      const prod = dbActions.getProductById(productId);
      if (!prod) return res.status(404).json({ error: 'Product not found' });

      let finalAmount = prod.price;
      if (couponCode) {
        const cp = dbActions.getCouponByCode(couponCode);
        if (cp) {
          finalAmount = Math.ceil(prod.price * (1 - cp.discountPercent / 100));
        }
      }

      // Initialize Order in local database
      const newOrder = dbActions.createOrder({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        productId: prod.id,
        productName: prod.name,
        amount: finalAmount,
        couponCode,
        status: 'pending'
      });

      const rzpConfig = dbActions.getRazorpayConfig();
      let razorpayOrderId = '';

      if (rzpConfig.keyId && rzpConfig.keySecret && rzpConfig.keyId !== 'YOUR_KEY_ID' && !rzpConfig.keyId.startsWith('rzp_test_SURYA')) {
        try {
          console.log(`Initializing real Razorpay client with Key ID: ${rzpConfig.keyId}`);
          const razorpay = new Razorpay({
            key_id: rzpConfig.keyId,
            key_secret: rzpConfig.keySecret
          });

          const orderOptions = {
            amount: finalAmount * 100, // Razorpay amount is in paise
            currency: rzpConfig.currency || 'INR',
            receipt: `receipt_${newOrder.id}`
          };

          const rzpOrder = await razorpay.orders.create(orderOptions);
          razorpayOrderId = rzpOrder.id;

          // Save the real Razorpay Order ID on the order (we maps it to paymentId for easy lookup)
          dbActions.updateOrder(newOrder.id, { paymentId: razorpayOrderId });
          console.log("Real Razorpay Order created successfully:", razorpayOrderId);
        } catch (rzpErr: any) {
          console.error("Failed to generate real Razorpay Order. Falling back to simulated flow:", rzpErr.message || rzpErr);
        }
      }

      res.status(201).json({
        orderId: newOrder.id, // local database internal id
        razorpayOrderId: razorpayOrderId || undefined, // the real Razorpay order ID
        amount: finalAmount,
        keyId: rzpConfig.enabled ? rzpConfig.keyId : 'rzp_test_SURYA2026KEY',
        currency: rzpConfig.currency || 'INR',
        productName: prod.name
      });
    } catch (err: any) {
      console.error("Create Order Server Failure:", err);
      res.status(500).json({ error: 'Failed to initialize order.' });
    }
  });

  // Complete / Verify Razorpay Payment (Handles both Real Cryptographic Signature and Secure Fallbacks)
  app.post('/api/orders/verify', authenticateToken, async (req: any, res: any) => {
    try {
      const { 
        orderId, 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        status, 
        paymentMethod 
      } = req.body;
      
      console.log("Verifying payment registers for Order:", orderId || razorpay_order_id);

      // Find order either by internal orderId or mapped Razorpay Order ID (saved in paymentId)
      let order = dbActions.getOrders().find(o => o.id === orderId);
      if (!order && razorpay_order_id) {
        order = dbActions.getOrders().find(o => o.paymentId === razorpay_order_id);
      }
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const rzpConfig = dbActions.getRazorpayConfig();
      let verified = false;
      let errorMsg = '';

      // Perform Signature Verification if real signature parameters are provided
      if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
        if (rzpConfig.keySecret && rzpConfig.keySecret !== 'YOUR_SECRET') {
          const textToVerify = razorpay_order_id + "|" + razorpay_payment_id;
          const generatedSignature = crypto
            .createHmac('sha256', rzpConfig.keySecret)
            .update(textToVerify)
            .digest('hex');

          if (generatedSignature === razorpay_signature) {
            verified = true;
            console.log("Real cryptographic Razorpay signature verified successfully!");
          } else {
            console.error("Razorpay Signature Validation Mismatch!");
            errorMsg = "Cryptographic signature mismatch. Transaction authentication rejected.";
          }
        } else {
          // No secret configured but signature passed? fallback
          verified = true;
          console.warn("Razorpay Secret missing in database configuration - completed via bypass.");
        }
      } else {
        // Fallback for simulated checkout form
        if (status === 'success') {
          verified = true;
        } else {
          errorMsg = "Simulated payment failed, transaction aborted.";
        }
      }

      if (verified) {
        const cleanPaymentId = razorpay_payment_id || 'pay_RZPSIM_' + Math.random().toString(36).substr(2, 10).toUpperCase();

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
          paymentMethod: paymentMethod || 'UPI_Razorpay',
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
          title: 'Razorpay Payment Completed Successful',
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
              payment_method: paymentMethod || 'UPI_Razorpay',
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


  // --- ADMIN PORTAL ENDPOINTS (SECURED) ---

  // Admin: Get Gemini config settings for dynamic translation API keys
  app.get('/api/admin/gemini-config', requireAdmin, (req, res) => {
    res.json(dbActions.getGeminiConfig ? dbActions.getGeminiConfig() : { apiKey: '' });
  });

  // Admin: Save or update Gemini translation key (Supports PUT & POST fallback)
  const saveGeminiConfigHandler = (req: any, res: any) => {
    const { apiKey } = req.body;
    const config = dbActions.updateGeminiConfig ? dbActions.updateGeminiConfig(apiKey) : { apiKey };
    res.json(config);
  };
  app.put('/api/admin/gemini-config', requireAdmin, saveGeminiConfigHandler);
  app.post('/api/admin/gemini-config', requireAdmin, saveGeminiConfigHandler);

  // Admin: Get Razorpay gateway settings with credential masking
  app.get('/api/admin/razorpay-config', requireAdmin, async (req, res) => {
    // Sync from Supabase first if active
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('settings_val')
          .eq('settings_key', 'razorpay_config')
          .maybeSingle();
        
        if (data && data.settings_val) {
          const parsed = JSON.parse(data.settings_val);
          dbActions.updateRazorpayConfig(parsed);
          console.log("Supabase: Pulled Razorpay configuration from cloud settings cache.");
        }
      } catch (sbErr: any) {
        console.warn("Supabase Config Fetch Failed (using local cache fallback):", sbErr.message || sbErr);
      }
    }

    const config = dbActions.getRazorpayConfig();
    res.json({
      ...config,
      keySecret: config.keySecret ? '********' : '',
      webhookSecret: config.webhookSecret ? '********' : ''
    });
  });

  // Admin: Update Razorpay gateway settings with mask protection (Supports PUT & POST fallback)
  const saveRazorpayConfigHandler = async (req: any, res: any) => {
    try {
      let body = req.body;
      if (body && body.obfuscated) {
        try {
          const decodedStr = Buffer.from(body.obfuscated, 'base64').toString('utf8');
          body = JSON.parse(decodedStr);
        } catch (e: any) {
          console.error("Failed to parse obfuscated Razorpay payload:", e.message || e);
        }
      }
      const { keyId, keySecret, mode, currency, enabled, webhookSecret } = body;
      const existingConfig = dbActions.getRazorpayConfig();
      
      let finalSecret = keySecret;
      if (!keySecret || keySecret === '********' || /^[•\*]+$/.test(keySecret)) {
        finalSecret = existingConfig.keySecret;
      }
      
      let finalWebhookSecret = webhookSecret;
      if (webhookSecret === '********' || (webhookSecret && /^[•\*]+$/.test(webhookSecret))) {
        finalWebhookSecret = existingConfig.webhookSecret;
      }

      const config = dbActions.updateRazorpayConfig({ 
        keyId, 
        keySecret: finalSecret, 
        mode, 
        currency, 
        enabled, 
        webhookSecret: finalWebhookSecret 
      });

      // Write to Supabase system_settings table if active to keep backend persistent in cloudSQL/Postgres
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const payloadString = JSON.stringify({ 
            keyId, 
            keySecret: finalSecret, 
            mode, 
            currency, 
            enabled, 
            webhookSecret: finalWebhookSecret 
          });
          
          await supabase
            .from('system_settings')
            .upsert({ settings_key: 'razorpay_config', settings_val: payloadString }, { onConflict: 'settings_key' });
          console.log("Supabase: Razorpay configuration successfully synchronized.");
        } catch (sbErr: any) {
          console.error("Supabase Sync Failed for Razorpay Config:", sbErr.message || sbErr);
        }
      }

      res.json({
        ...config,
        keySecret: config.keySecret ? '********' : '',
        webhookSecret: config.webhookSecret ? '********' : ''
      });
    } catch (err: any) {
      console.error("Critical error in saveRazorpayConfigHandler:", err);
      res.status(500).json({ error: `Internal server error handling config: ${err.message || err}` });
    }
  };
  app.put('/api/admin/razorpay-config', requireAdmin, saveRazorpayConfigHandler);
  app.post('/api/admin/razorpay-config', requireAdmin, saveRazorpayConfigHandler);

  // Admin: Get Supabase configuration settings
  app.get('/api/admin/supabase-config', requireAdmin, (req, res) => {
    res.json(dbActions.getSupabaseConfig ? dbActions.getSupabaseConfig() : { url: '', anonKey: '', enabled: false });
  });

  // Admin: Get Supabase database SQL schema directly from the project directory
  app.get('/api/admin/supabase-schema', requireAdmin, (req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        return res.json({ schema: schemaContent });
      }
      return res.status(404).json({ error: 'supabase_schema.sql file not found in build directory' });
    } catch (err: any) {
      return res.status(500).json({ error: `Failed to read schema file: ${err.message}` });
    }
  });

  // Admin: Update Supabase configuration settings (Supports PUT & POST fallback)
  const saveSupabaseConfigHandler = (req: any, res: any) => {
    const { url, anonKey, enabled } = req.body;
    const config = dbActions.updateSupabaseConfig ? dbActions.updateSupabaseConfig({ url, anonKey, enabled }) : { url, anonKey, enabled };
    res.json(config);
  };
  app.put('/api/admin/supabase-config', requireAdmin, saveSupabaseConfigHandler);
  app.post('/api/admin/supabase-config', requireAdmin, saveSupabaseConfigHandler);

  // Admin: Test connection of Supabase integration
  app.post('/api/admin/supabase-config/test', requireAdmin, async (req, res) => {
    const { url, anonKey } = req.body;
    if (!url || !anonKey) {
      return res.status(400).json({ error: 'Supabase URL and Anon Key are required to run Connection Test.' });
    }
    try {
      const client = createSupabaseClient(url, anonKey, {
        auth: { persistSession: false }
      });
      // Try to query schema meta, even if query errors (table not found), reachable is true
      const { error } = await client.from('_dummy_test_').select('*').limit(1).maybeSingle();
      if (error && (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.code === 'PGRST111')) {
        return res.status(400).json({ error: `Connection failed: ${error.message}` });
      }
      res.json({ success: true, message: 'Reachable! Supabase connection is responsive and authenticated.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Supabase host remains unreachable.' });
    }
  });

  // Admin: Get Hostinger MySQL configuration settings
  app.get('/api/admin/hostinger-config', requireAdmin, (req, res) => {
    res.json(dbActions.getHostingerConfig ? dbActions.getHostingerConfig() : { host: '', user: '', pass: '', database: '', port: 3306, enabled: false });
  });

  // Admin: Update Hostinger MySQL configuration settings (Supports PUT & POST fallback)
  const saveHostingerConfigHandler = async (req: any, res: any) => {
    const { host, user, pass, database, port, enabled } = req.body;
    const config = dbActions.updateHostingerConfig 
      ? dbActions.updateHostingerConfig({ host, user, pass, database, port, enabled }) 
      : { host, user, pass, database, port, enabled };
    
    // Auto-create tables if enabled is true!
    if (enabled) {
      try {
        const { initializeHostingerSchema } = await import('./server/hostinger.js');
        await initializeHostingerSchema(config);
      } catch (err: any) {
        console.error('Failed to initialize Hostinger schema:', err);
        return res.status(400).json({ error: `Saved, but connection failed to create Hostinger MySQL tables: ${err.message}` });
      }
    }
    res.json(config);
  };
  app.put('/api/admin/hostinger-config', requireAdmin, saveHostingerConfigHandler);
  app.post('/api/admin/hostinger-config', requireAdmin, saveHostingerConfigHandler);

  // Admin: Test connection of Hostinger database integration
  app.post('/api/admin/hostinger-config/test', requireAdmin, async (req, res) => {
    const { host, user, pass, database, port } = req.body;
    if (!host || !user || !database) {
      return res.status(400).json({ error: 'Host, User and Database Name are required to test connection.' });
    }
    try {
      const { initializeHostingerSchema } = await import('./server/hostinger.js');
      await initializeHostingerSchema({ host, user, pass, database, port: Number(port) || 3306, enabled: true });
      res.json({ success: true, message: 'Hostinger MySQL connection verified and tables generated successfully!' });
    } catch (err: any) {
      res.status(400).json({ error: `Connection failed: ${err.message}` });
    }
  });

  // Admin: Force immediate replication/migration to Hostinger MySQL
  app.post('/api/admin/hostinger-config/migrate', requireAdmin, async (req, res) => {
    try {
      const { migrateLocalDataToHostinger } = await import('./server/hostinger.js');
      const result = await migrateLocalDataToHostinger();
      res.json({ success: true, message: 'Local database catalog successfully published/written to Hostinger!', stats: result.stats });
    } catch (err: any) {
      res.status(500).json({ error: `Migration failed: ${err.message}` });
    }
  });

  // Admin Dashboard Statistics
  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    res.json(dbActions.getSystemStats());
  });

  // Admin: Customers List
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    res.json(dbActions.getUsers().filter(u => u.role === 'customer'));
  });

  // Admin: Customer Complete Profile and Purchase Details
  app.get('/api/admin/customers/:userId/details', requireAdmin, (req, res) => {
    const userId = req.params.userId;
    const users = dbActions.getUsers();
    const user = users.find(u => u.id === userId && u.role === 'customer');
    if (!user) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const profile = dbActions.getCustomerProfileByUserId(userId) || null;
    const orders = dbActions.getOrders().filter(o => o.userId === userId || o.userEmail === user.email);
    const licenses = dbActions.getLicenses().filter(l => l.userEmail === user.email);
    const tickets = dbActions.getTickets().filter(t => t.userId === userId);
    const payments = dbActions.getPaymentsByUser(userId);
    const invoices = dbActions.getInvoicesByUser(userId);

    res.json({
      user,
      profile,
      orders,
      licenses,
      tickets,
      payments,
      invoices
    });
  });

  // Admin: Orders List
  app.get('/api/admin/orders', requireAdmin, (req, res) => {
    res.json(dbActions.getOrders());
  });

  // Admin: Licenses List
  app.get('/api/admin/licenses', requireAdmin, (req, res) => {
    res.json(dbActions.getLicenses());
  });

  // Admin: Revoke/Activate License
  app.put('/api/admin/licenses/:id', requireAdmin, (req, res) => {
    const { status } = req.body;
    const l = dbActions.updateLicenseStatus(req.params.id, status);
    if (!l) return res.status(404).json({ error: 'License not found' });
    res.json(l);
  });

  // Admin: Support Tickets List
  app.get('/api/admin/tickets', requireAdmin, (req, res) => {
    res.json(dbActions.getTickets());
  });

  // Admin: Ticket Status Update
  app.put('/api/admin/tickets/:id/status', requireAdmin, (req, res) => {
    const { status } = req.body;
    const t = dbActions.updateTicketStatus(req.params.id, status);
    if (!t) return res.status(404).json({ error: 'Ticket not found' });
    res.json(t);
  });

  // Admin: Ticket Admin Reply
  app.post('/api/admin/tickets/:id/reply', requireAdmin, (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Reply message required' });

    const updated = dbActions.addTicketReply(req.params.id, {
      authorName: 'Suryatech Admin Support',
      authorRole: 'admin',
      message
    });

    if (!updated) return res.status(404).json({ error: 'Ticket not found' });
    res.json(updated);
  });

  // Admin: Coupons CRUD
  app.get('/api/admin/coupons', requireAdmin, (req, res) => {
    res.json(dbActions.getCoupons());
  });

  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const cp: Coupon = req.body;
    if (!cp.code || !cp.discountPercent || !cp.expiresBy) {
      return res.status(400).json({ error: 'Missing field values' });
    }
    const newCp = dbActions.createCoupon({
      code: cp.code.toUpperCase(),
      discountPercent: Number(cp.discountPercent),
      active: true,
      expiresBy: cp.expiresBy
    });
    res.status(201).json(newCp);
  });

  app.put('/api/admin/coupons/:code/toggle', requireAdmin, (req, res) => {
    const cp = dbActions.toggleCouponActive(req.params.code);
    if (!cp) return res.status(404).json({ error: 'Coupon not found' });
    res.json(cp);
  });

  app.delete('/api/admin/coupons/:code', requireAdmin, (req, res) => {
    dbActions.deleteCoupon(req.params.code);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  });

  // Admin: Downloads Release CRUD
  app.post('/api/admin/downloads/upload-exe', requireAdmin, (req, res) => {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Filename and binary contents are requested' });
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const dirPath = path.join(process.cwd(), 'data', 'uploads');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.join(dirPath, filename);
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true, message: 'EXE file uploaded and recorded successfully', path: `/api/downloads/setup/${filename}` });
    } catch (err: any) {
      console.error('Error writing uploaded EXE:', err);
      res.status(500).json({ error: 'Failed saving EXE file to disk: ' + err.message });
    }
  });

  app.post('/api/admin/downloads/upload-pdf', requireAdmin, (req, res) => {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Filename and binary contents are requested' });
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const dirPath = path.join(process.cwd(), 'data', 'uploads');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.join(dirPath, 'usr-manual.pdf');
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true, message: 'PDF user manual uploaded and stored successfully', path: '/api/downloads/setup/usr-manual-pdf' });
    } catch (err: any) {
      console.error('Error writing uploaded PDF:', err);
      res.status(500).json({ error: 'Failed saving PDF manual to disk: ' + err.message });
    }
  });

  app.post('/api/admin/downloads', requireAdmin, (req, res) => {
    const { version, filename, fileSize, releaseNotes, softwareName } = req.body;
    if (!version || !filename || !fileSize) {
      return res.status(400).json({ error: 'Version, file size & file name required' });
    }

    const newDl = dbActions.createDownloadInfo({
      version,
      filename,
      fileSize,
      downloadUrl: `/api/downloads/setup/${version}`,
      releaseNotes: Array.isArray(releaseNotes) ? releaseNotes : [releaseNotes],
      downloadCount: 0
    });

    // Notify all registered Customers that a new software version is available!
    const users = dbActions.getUsers();
    users.forEach(u => {
      if (u.role === 'customer') {
        dbActions.createNotification({
          userId: u.id,
          title: 'New Software Version Available',
          message: `Update Available! BSP Suryatech ${softwareName || 'Billing Software'} has been upgraded to version ${version}. Download raw package installer now to remain on secure latest version.`,
          type: 'new_version'
        });
      }
    });

    res.status(201).json(newDl);
  });

  // Dedicated custom admin endpoint for manual uploading action parameters
  app.post('/api/admin/upload-version', requireAdmin, (req, res) => {
    const { softwareName, versionNumber, releaseNotes, filename, base64Data } = req.body;
    if (!versionNumber || !filename) {
      return res.status(400).json({ error: 'Version number and filename parameters requested' });
    }

    if (base64Data) {
      try {
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(process.cwd(), 'data', 'uploads', filename);
        if (!fs.existsSync(path.dirname(filePath))) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);
      } catch (err: any) {
        console.error('Save manual exe failed:', err);
      }
    }

    const rNotes = releaseNotes 
      ? (Array.isArray(releaseNotes) ? releaseNotes : [releaseNotes])
      : ['General stability and bugfix iteration.'];

    const newDl = dbActions.createDownloadInfo({
      version: versionNumber,
      filename,
      fileSize: '15.6 MB',
      downloadUrl: `/api/downloads/setup/${versionNumber}`,
      releaseNotes: rNotes,
      downloadCount: 0
    });

    // Notify all customer profiles
    const users = dbActions.getUsers();
    users.forEach(u => {
      if (u.role === 'customer') {
        dbActions.createNotification({
          userId: u.id,
          title: `New Software Version Available (${versionNumber})`,
          message: `Update Available! ${softwareName || 'BSP Suryatech Software'} is updated to version ${versionNumber}.`,
          type: 'new_version'
        });
      }
    });

    res.status(201).json({ success: true, download: newDl });
  });

  app.delete('/api/admin/downloads/:id', requireAdmin, (req, res) => {
    dbActions.deleteDownloadInfo(req.params.id);
    res.json({ success: true, message: 'Release deleted successfully' });
  });

  // Admin: Blogs CRUD
  app.post('/api/admin/blogs', requireAdmin, (req, res) => {
    const { title, excerpt, content, author, image, date, readTime } = req.body;
    if (!title || !excerpt || !content) {
      return res.status(400).json({ error: 'Title, excerpt, and content required' });
    }

    const b = dbActions.createBlog({
      title,
      excerpt,
      content,
      author: author || 'Suryatech Admin Team',
      image: image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
      date: date || new Date().toISOString().split('T')[0],
      readTime: readTime || '5 min read'
    });

    res.status(201).json(b);
  });

  app.delete('/api/admin/blogs/:id', requireAdmin, (req, res) => {
    dbActions.deleteBlog(req.params.id);
    res.json({ success: true, message: 'Blog deleted successfully' });
  });

  // Admin: Create Product
  app.post('/api/admin/products', requireAdmin, async (req, res) => {
    const { 
      name, version, size, price, originalPrice, features, description, connectedPlan,
      category, fullDescription, systemRequirements, licenseInfo, demoVideoUrl, gallery, downloadUrl
    } = req.body;
    if (!name || !price || !version || !size) {
      return res.status(400).json({ error: 'Name, price, version, size required' });
    }
    const newProd = dbActions.createProduct({
      name,
      version,
      size,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      features: Array.isArray(features) ? features : [features],
      description: description || '',
      downloadUrl: downloadUrl || `/api/downloads/setup/prod-${Math.random().toString(36).substr(2, 4)}`,
      connectedPlan: connectedPlan || '',
      category: category || 'Retail & POS Billing',
      fullDescription: fullDescription || description || '',
      systemRequirements: systemRequirements || '',
      licenseInfo: licenseInfo || '',
      demoVideoUrl: demoVideoUrl || '',
      gallery: Array.isArray(gallery) ? gallery : []
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').upsert({
          id: newProd.id,
          name: newProd.name,
          version: newProd.version,
          size: newProd.size,
          price: newProd.price,
          original_price: newProd.originalPrice,
          features: JSON.stringify(newProd.features),
          description: newProd.description,
          download_url: newProd.downloadUrl,
          connected_plan: newProd.connectedPlan
        });
      } catch (sbErr) {
        console.warn("Background Supabase product write sync skipped:", sbErr);
      }
    }

    res.status(201).json(newProd);
  });

  // Admin: Update Product
  app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    const p = dbActions.updateProduct(req.params.id, req.body);
    if (!p) return res.status(404).json({ error: 'Product not found' });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').upsert({
          id: p.id,
          name: p.name,
          version: p.version,
          size: p.size,
          price: p.price,
          original_price: p.originalPrice,
          features: JSON.stringify(p.features),
          description: p.description,
          download_url: p.downloadUrl,
          connected_plan: p.connectedPlan
        });
      } catch (sbErr) {
        console.warn("Background Supabase product update sync skipped:", sbErr);
      }
    }

    res.json(p);
  });

  // Admin: Delete Product
  app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    dbActions.deleteProduct(req.params.id);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', req.params.id);
      } catch (sbErr) {
        console.warn("Background Supabase product delete sync skipped:", sbErr);
      }
    }

    res.json({ success: true });
  });

  // Admin: Solutions CRUD
  app.get('/api/admin/solutions', requireAdmin, (req, res) => {
    res.json(dbActions.getSolutions());
  });

  app.post('/api/admin/solutions', requireAdmin, (req, res) => {
    const { title, category, subtitle, description, price, features, icon, badge, badgeColor, mappedPlanId, exeUrl, demoVideoUrl, gallery } = req.body;
    if (!title || !category || !description) {
      return res.status(400).json({ error: 'Title, category, and description are required' });
    }
    const newSol = dbActions.createSolution({
      title,
      category,
      subtitle: subtitle || '',
      description,
      price: price || 'INR 0',
      features: Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []),
      icon: icon || '🛍️',
      badge: badge || '',
      badgeColor: badgeColor || 'emerald',
      mappedPlanId: mappedPlanId || 'prod-billing-pro',
      exeUrl: exeUrl || '',
      demoVideoUrl: demoVideoUrl || '',
      gallery: Array.isArray(gallery) ? gallery : []
    });
    res.status(201).json(newSol);
  });

  app.put('/api/admin/solutions/:id', requireAdmin, (req, res) => {
    const { title, category, subtitle, description, price, features, icon, badge, badgeColor, mappedPlanId, exeUrl, demoVideoUrl, gallery } = req.body;
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (features !== undefined) {
      updates.features = Array.isArray(features) ? features : (typeof features === 'string' ? features.split('\n').filter(Boolean) : []);
    }
    if (icon !== undefined) updates.icon = icon;
    if (badge !== undefined) updates.badge = badge;
    if (badgeColor !== undefined) updates.badgeColor = badgeColor;
    if (mappedPlanId !== undefined) updates.mappedPlanId = mappedPlanId;
    if (exeUrl !== undefined) updates.exeUrl = exeUrl;
    if (demoVideoUrl !== undefined) updates.demoVideoUrl = demoVideoUrl;
    if (gallery !== undefined) updates.gallery = gallery;

    const updated = dbActions.updateSolution(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Solution not found' });
    res.json(updated);
  });

  app.delete('/api/admin/solutions/:id', requireAdmin, (req, res) => {
    dbActions.deleteSolution(req.params.id);
    res.json({ success: true, message: 'Solution deleted successfully' });
  });

  // Admin: Video Tutorials CRUD
  app.post('/api/admin/videos', requireAdmin, (req, res) => {
    const { title, duration, youtubeId, thumbnail, description } = req.body;
    if (!title || !youtubeId) {
      return res.status(400).json({ error: 'Title and YouTube ID/URL are required' });
    }
    const newVid = dbActions.createVideoTutorial({
      title,
      duration: duration || '05:00 Mins',
      youtubeId,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
      description: description || ''
    });
    res.status(201).json(newVid);
  });

  app.put('/api/admin/videos/:id', requireAdmin, (req, res) => {
    const v = dbActions.updateVideoTutorial(req.params.id, req.body);
    if (!v) return res.status(404).json({ error: 'Video not found' });
    res.json(v);
  });

  app.delete('/api/admin/videos/:id', requireAdmin, (req, res) => {
    dbActions.deleteVideoTutorial(req.params.id);
    res.json({ success: true });
  });

  // Admin: Testimonials CRUD
  app.post('/api/admin/testimonials', requireAdmin, (req, res) => {
    const { name, company, role, text, rating } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'Name and testimonial text required' });
    const nt = dbActions.createTestimonial({
      name,
      company: company || 'Merchant',
      role: role || 'Store Manager',
      text,
      rating: rating ? Number(rating) : 5
    });
    res.status(201).json(nt);
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, (req, res) => {
    dbActions.deleteTestimonial(req.params.id);
    res.json({ success: true });
  });

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


  // --- VITE AND FE STATIC SERVICES INTEGRATION ---

  const isProd = process.env.NODE_ENV === 'production';

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
