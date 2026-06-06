/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { dbActions, verifyPassword, signToken, verifyToken } from './server/db';
import { Coupon } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please fill all fields' });
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
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = dbActions.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hash = dbActions.getUserPasswordHash(user.id);
    if (!verifyPassword(password, hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user });
  });

  // Get current user profile
  app.get('/api/auth/me', authenticateToken, (req: any, res: any) => {
    const user = dbActions.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // Products
  app.get('/api/products', (req, res) => {
    res.json(dbActions.getProducts());
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

  // Create Order (Razorpay Simulation Initializer)
  app.post('/api/orders/create', authenticateToken, (req: any, res: any) => {
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

    // Initialize Order
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

    res.status(201).json({
      orderId: newOrder.id,
      amount: finalAmount,
      keyId: 'rzp_test_SURYA2026KEY', // Realistic Razorpay Sandbox key
      currency: 'INR',
      productName: prod.name
    });
  });

  // Complete Simulated Razorpay Payment
  app.post('/api/orders/verify', authenticateToken, (req: any, res: any) => {
    const { orderId, paymentId, status } = req.body;
    
    const order = dbActions.getOrders().find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status === 'success') {
      const cleanPaymentId = paymentId || 'pay_RZPSIM_' + Math.random().toString(36).substr(2, 10).toUpperCase();

      // 1. Update Order status
      dbActions.updateOrder(orderId, {
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
        paymentMethod: 'UPI_Razorpay',
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

      return res.json({
        success: true,
        message: 'Payment completed and verified successfully! Your license key is now active.',
        order,
        license
      });
    } else {
      dbActions.updateOrder(orderId, { status: 'failed' });
      return res.status(400).json({ error: 'Simulated payment failed, transaction aborted.' });
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

  // Admin Dashboard Statistics
  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    res.json(dbActions.getSystemStats());
  });

  // Admin: Customers List
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    res.json(dbActions.getUsers().filter(u => u.role === 'customer'));
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
      const filePath = path.join(process.cwd(), 'data', 'uploads', filename);
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true, message: 'EXE file uploaded and recorded successfully', path: `/api/downloads/setup/${filename}` });
    } catch (err: any) {
      console.error('Error writing uploaded EXE:', err);
      res.status(500).json({ error: 'Failed saving EXE file to disk: ' + err.message });
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
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const { name, version, size, price, originalPrice, features, description } = req.body;
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
      downloadUrl: `/api/downloads/setup/prod-${Math.random().toString(36).substr(2, 4)}`
    });
    res.status(201).json(newProd);
  });

  // Admin: Update Product
  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const p = dbActions.updateProduct(req.params.id, req.body);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  });

  // Admin: Delete Product
  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    dbActions.deleteProduct(req.params.id);
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


  // --- VITE AND FE STATIC SERVICES INTEGRATION ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for React SPA Router fallbacks
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  BSP Suryatech SaaS Live Server running on port ${PORT}`);
    console.log(`  Local Access: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal dev server initialize failure:', err);
  process.exit(1);
});
