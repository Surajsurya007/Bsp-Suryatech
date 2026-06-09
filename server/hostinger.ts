/**
 * Hostinger MySQL Database Module
 * Handles connections, schema generation, reading/writing and synchronization.
 */

import mysql from 'mysql2/promise';
import { db } from './db.js'; // Import default in-memory database instance to allow migration/sync

let pool: mysql.Pool | null = null;
let initialized = false;

// Interface for hostinger config
export interface HostingerConfig {
  host: string;
  user: string;
  pass: string;
  database: string;
  port: number;
  enabled: boolean;
}

export function isHostingerEnabled(): boolean {
  return !!(db as any).hostingerConfig?.enabled && !!(db as any).hostingerConfig?.host;
}

export async function getHostingerPool(): Promise<mysql.Pool | null> {
  const config: HostingerConfig = (db as any).hostingerConfig || {
    host: '',
    user: '',
    pass: '',
    database: '',
    port: 3306,
    enabled: false
  };

  if (!config.enabled || !config.host) {
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }
    return null;
  }

  // If pool already exists, check if config matches
  if (pool) {
    return pool;
  }

  try {
    pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.pass,
      database: config.database,
      port: config.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000 // 10s timeout
    });
    return pool;
  } catch (err) {
    console.error('Failed to create Hostinger MySQL pool:', err);
    return null;
  }
}

export async function queryHostinger<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const activePool = await getHostingerPool();
  if (!activePool) {
    throw new Error('Hostinger database is not configured or enabled.');
  }
  const [rows] = await activePool.execute(sql, params);
  return rows as T[];
}

/**
 * Creates tables in Hostinger MySQL database if they do not exist.
 */
export async function initializeHostingerSchema(config?: HostingerConfig): Promise<void> {
  let activePool: mysql.Pool | null = null;
  
  if (config) {
    activePool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.pass,
      database: config.database,
      port: config.port,
      connectionLimit: 1,
      connectTimeout: 8000
    });
  } else {
    activePool = await getHostingerPool();
  }

  if (!activePool) {
    throw new Error('Hostinger SQL pool unreachable.');
  }

  try {
    // 1. Users
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL,
        createdAt VARCHAR(255) NOT NULL,
        language VARCHAR(50) NULL,
        passwordHash VARCHAR(255) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Language Configs
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS language_configs (
        code VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        flag VARCHAR(50) NOT NULL,
        enabled TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Customer Profiles
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        userId VARCHAR(255) PRIMARY KEY,
        clientName VARCHAR(255) NOT NULL,
        businessName VARCHAR(255) NOT NULL,
        contactNumber VARCHAR(255) NOT NULL,
        emailAddress VARCHAR(255) NOT NULL,
        businessAddress TEXT NOT NULL,
        city VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        pincode VARCHAR(50) NOT NULL,
        gstNumber VARCHAR(50) NULL,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Products
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        version VARCHAR(50) NOT NULL,
        size VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        originalPrice DECIMAL(10,2) NULL,
        features TEXT NOT NULL,
        description TEXT NOT NULL,
        downloadUrl VARCHAR(255) NOT NULL,
        createdAt VARCHAR(255) NOT NULL,
        connectedPlan VARCHAR(255) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Orders
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        userEmail VARCHAR(255) NOT NULL,
        userName VARCHAR(255) NOT NULL,
        productId VARCHAR(255) NOT NULL,
        productName VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        couponCode VARCHAR(50) NULL,
        status VARCHAR(50) NOT NULL,
        paymentId VARCHAR(255) NULL,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Licenses
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS licenses (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        userEmail VARCHAR(255) NOT NULL,
        orderId VARCHAR(255) NOT NULL,
        productId VARCHAR(255) NOT NULL,
        productName VARCHAR(255) NOT NULL,
        licenseKey VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL,
        expiresAt VARCHAR(255) NOT NULL,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Download Centric Logs
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS downloads_info (
        id VARCHAR(255) PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        fileSize VARCHAR(50) NOT NULL,
        downloadUrl VARCHAR(255) NOT NULL,
        releaseNotes TEXT NOT NULL,
        downloadCount INT NOT NULL DEFAULT 0,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Support tickets
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        userEmail VARCHAR(255) NOT NULL,
        userName VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        createdAt VARCHAR(255) NOT NULL,
        replies TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Coupons
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        code VARCHAR(50) PRIMARY KEY,
        discountPercent INT NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        expiresBy VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Testimonials
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        rating INT NOT NULL DEFAULT 5,
        avatar VARCHAR(255) NULL,
        createdAt VARCHAR(255) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. Blogs
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(255) NOT NULL,
        date VARCHAR(255) NOT NULL,
        readTime VARCHAR(50) NOT NULL,
        excerpt TEXT NOT NULL,
        image VARCHAR(255) NOT NULL,
        createdAt VARCHAR(255) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 12. Reviews
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(255) PRIMARY KEY,
        productId VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        comment TEXT NOT NULL,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. Payments Activity
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        invoiceNumber VARCHAR(255) NOT NULL,
        transactionId VARCHAR(255) NOT NULL,
        paymentMethod VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        paymentDate VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        orderId VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 14. Invoices
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(255) PRIMARY KEY,
        invoiceNumber VARCHAR(255) NOT NULL,
        orderId VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL,
        clientName VARCHAR(255) NOT NULL,
        businessName VARCHAR(255) NOT NULL,
        emailAddress VARCHAR(255) NOT NULL,
        contactNumber VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        gstAmount DECIMAL(10,2) NOT NULL,
        netAmount DECIMAL(10,2) NOT NULL,
        productName VARCHAR(255) NOT NULL,
        licenseKey VARCHAR(255) NOT NULL,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 15. Notifications
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        \`read\` TINYINT(1) NOT NULL DEFAULT 0,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 16. Video Tutorials
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS video_tutorials (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        youtubeId VARCHAR(255) NOT NULL,
        thumbnail VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 17. Multi-purpose Key-Value App Settings (Razorpay, helpline, counters, etc.)
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        settings_key VARCHAR(255) PRIMARY KEY,
        settings_val TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    initialized = true;
    console.log('Hostinger schema successfully synchronized!');
  } finally {
    // If a temporary pool was created, make sure it is torn down
    if (config) {
      await activePool.end().catch(() => {});
    }
  }
}

/**
 * Migration trigger: Pulls all current local JSON database data
 * and pushes it directly into Hostinger MySQL tables.
 * Returns migration report.
 */
export async function migrateLocalDataToHostinger(): Promise<{ success: boolean; stats: Record<string, number> }> {
  const activePool = await getHostingerPool();
  if (!activePool) {
    throw new Error('Could not establish persistent Hostinger SQL connection for migration.');
  }

  // Ensure tables exist
  await initializeHostingerSchema();

  const report = {
    users: 0,
    language_configs: 0,
    customer_profiles: 0,
    products: 0,
    orders: 0,
    licenses: 0,
    downloads_info: 0,
    support_tickets: 0,
    coupons: 0,
    testimonials: 0,
    blogs: 0,
    reviews: 0,
    payments: 0,
    invoices: 0,
    notifications: 0,
    video_tutorials: 0,
    system_settings: 0
  };

  try {
    // 1. Clear existing Hostinger tables to rewrite cleanly
    const tablesToClear = [
      'users', 'language_configs', 'customer_profiles', 'products', 'orders',
      'licenses', 'downloads_info', 'support_tickets', 'coupons', 'testimonials',
      'blogs', 'reviews', 'payments', 'invoices', 'notifications', 'video_tutorials', 'system_settings'
    ];
    for (const table of tablesToClear) {
      await activePool.execute(`TRUNCATE TABLE \`${table}\``).catch(async () => {
        // Fallback if foreign key constraints interfere
        await activePool.execute(`DELETE FROM \`${table}\``);
      });
    }

    // 2. Load Local JSON DB
    const {
      users = [],
      passwordHashes = {},
      customerProfiles = [],
      products = [],
      orders = [],
      licenses = [],
      downloads = [],
      tickets = [],
      coupons = [],
      testimonials = [],
      blogs = [],
      reviews = [],
      payments = [],
      invoices = [],
      notifications = [],
      languageConfigs = [],
      videos = [],
      downloadCounter = 1420,
      razorpayConfig,
      helpline,
      geminiApiKey,
      supabaseConfig
    } = db;

    // 3. Migrate Users
    for (const u of users) {
      const passHash = passwordHashes[u.id] || null;
      await activePool.execute(
        'INSERT INTO users (id, name, email, role, createdAt, language, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.name, u.email, u.role, u.createdAt, u.language || null, passHash]
      );
      report.users++;
    }

    // 4. Migrate Languages
    for (const lang of languageConfigs) {
      await activePool.execute(
        'INSERT INTO language_configs (code, name, flag, enabled) VALUES (?, ?, ?, ?)',
        [lang.code, lang.name, lang.flag, lang.enabled ? 1 : 0]
      );
      report.language_configs++;
    }

    // 5. Migrate Profiles
    for (const p of customerProfiles) {
      await activePool.execute(
        'INSERT INTO customer_profiles (userId, clientName, businessName, contactNumber, emailAddress, businessAddress, city, state, pincode, gstNumber, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.userId, p.clientName, p.businessName, p.contactNumber, p.emailAddress, p.businessAddress, p.city, p.state, p.pincode, p.gstNumber || null, p.createdAt]
      );
      report.customer_profiles++;
    }

    // 6. Migrate Products
    for (const prod of products) {
      await activePool.execute(
        'INSERT INTO products (id, name, version, size, price, originalPrice, features, description, downloadUrl, createdAt, connectedPlan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [prod.id, prod.name, prod.version, prod.size, prod.price, prod.originalPrice || null, JSON.stringify(prod.features), prod.description, prod.downloadUrl, prod.createdAt, prod.connectedPlan || null]
      );
      report.products++;
    }

    // 7. Migrate Orders
    for (const ord of orders) {
      await activePool.execute(
        'INSERT INTO orders (id, userId, userEmail, userName, productId, productName, amount, couponCode, status, paymentId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [ord.id, ord.userId, ord.userEmail, ord.userName, ord.productId, ord.productName, ord.amount, ord.couponCode || null, ord.status, ord.paymentId || null, ord.createdAt]
      );
      report.orders++;
    }

    // 8. Migrate Licenses
    for (const lic of licenses) {
      await activePool.execute(
        'INSERT INTO licenses (id, userId, userEmail, orderId, productId, productName, licenseKey, status, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [lic.id, lic.userId, lic.userEmail, lic.orderId, lic.productId, lic.productName, lic.licenseKey, lic.status, lic.expiresAt, lic.createdAt]
      );
      report.licenses++;
    }

    // 9. Migrate Downloads
    for (const dl of downloads) {
      await activePool.execute(
        'INSERT INTO downloads_info (id, version, filename, fileSize, downloadUrl, releaseNotes, downloadCount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [dl.id, dl.version, dl.filename, dl.fileSize, dl.downloadUrl, JSON.stringify(dl.releaseNotes), dl.downloadCount || 0, dl.createdAt]
      );
      report.downloads_info++;
    }

    // 10. Migrate Tickets
    for (const tk of tickets) {
      await activePool.execute(
        'INSERT INTO support_tickets (id, userId, userEmail, userName, title, description, category, status, createdAt, replies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [tk.id, tk.userId, tk.userEmail, tk.userName, tk.title, tk.description, tk.category, tk.status, tk.createdAt, JSON.stringify(tk.replies)]
      );
      report.support_tickets++;
    }

    // 11. Migrate Coupons
    for (const cp of coupons) {
      await activePool.execute(
        'INSERT INTO coupons (code, discountPercent, active, expiresBy) VALUES (?, ?, ?, ?)',
        [cp.code, cp.discountPercent, cp.active ? 1 : 0, cp.expiresBy]
      );
      report.coupons++;
    }

    // 12. Migrate Testimonials
    for (const test of testimonials) {
      await activePool.execute(
        'INSERT INTO testimonials (id, name, company, role, text, rating, avatar, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [test.id, test.name, test.company, test.role, test.text, test.rating || 5, (test as any).avatar || null, new Date().toISOString()]
      );
      report.testimonials++;
    }

    // 13. Migrate Blogs
    for (const b of blogs) {
      await activePool.execute(
        'INSERT INTO blogs (id, title, content, author, date, readTime, excerpt, image, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [b.id, b.title, b.content, b.author, b.date, b.readTime, b.excerpt, b.image, new Date().toISOString()]
      );
      report.blogs++;
    }

    // 14. Migrate Reviews
    for (const r of reviews) {
      await activePool.execute(
        'INSERT INTO reviews (id, productId, name, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [r.id, r.productId, r.name, r.rating, r.comment, r.createdAt]
      );
      report.reviews++;
    }

    // 15. Migrate Payments
    for (const pay of payments) {
      await activePool.execute(
        'INSERT INTO payments (id, invoiceNumber, transactionId, paymentMethod, amount, paymentDate, status, orderId, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [pay.id, pay.invoiceNumber, pay.transactionId, pay.paymentMethod, pay.amount, pay.paymentDate, pay.status, pay.orderId, pay.userId]
      );
      report.payments++;
    }

    // 16. Migrate Invoices
    for (const inv of invoices) {
      await activePool.execute(
        'INSERT INTO invoices (id, invoiceNumber, orderId, userId, clientName, businessName, emailAddress, contactNumber, amount, gstAmount, netAmount, productName, licenseKey, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [inv.id, inv.invoiceNumber, inv.orderId, inv.userId, inv.clientName, inv.businessName, inv.emailAddress, inv.contactNumber, inv.amount, inv.gstAmount, inv.netAmount, inv.productName, inv.licenseKey, inv.createdAt]
      );
      report.invoices++;
    }

    // 17. Migrate Notifications
    for (const n of notifications) {
      await activePool.execute(
        'INSERT INTO notifications (id, userId, title, message, type, \`read\`, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [n.id, n.userId, n.title, n.message, n.type, n.read ? 1 : 0, n.createdAt]
      );
      report.notifications++;
    }

    // 18. Migrate Videos
    for (const v of videos) {
      await activePool.execute(
        'INSERT INTO video_tutorials (id, title, duration, youtubeId, thumbnail, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [v.id, v.title, v.duration, v.youtubeId, v.thumbnail, v.description, v.createdAt || new Date().toISOString()]
      );
      report.video_tutorials++;
    }

    // 19. Set Settings Variables
    const settings = {
      downloadCounter: String(downloadCounter),
      razorpayConfig: JSON.stringify(razorpayConfig || {}),
      helpline: helpline || '+91 95535 28282',
      geminiApiKey: geminiApiKey || '',
      supabaseConfig: JSON.stringify(supabaseConfig || {})
    };

    for (const [key, val] of Object.entries(settings)) {
      await activePool.execute(
        'INSERT INTO system_settings (settings_key, settings_val) VALUES (?, ?)',
        [key, val]
      );
      report.system_settings++;
    }

    console.log('Successfully completed Hostinger SQL migration catalog:', report);
    return { success: true, stats: report };
  } catch (err: any) {
    console.error('Migration to Hostinger failed:', err);
    throw err;
  }
}
