/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Product, Order, License, DownloadInfo, SupportTicket, Coupon, Testimonial, Blog, Review, TicketReply, SystemStats, CustomerProfile, PaymentRecord, Invoice, Notification, LanguageConfig, VideoTutorial, RazorpayConfig, SoftwareSolution } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// JWT Secret
export const JWT_SECRET = process.env.JWT_SECRET || 'bsp-suryatech-secure-hmac-secret-key-2026';

export const defaultLanguageConfigs: LanguageConfig[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', enabled: true },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', enabled: true },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳', enabled: true },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳', enabled: true },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', enabled: true },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', enabled: true },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳', enabled: true },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳', enabled: true },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳', enabled: true },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳', enabled: true }
];

// Cryto Helpers
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(':');
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === checkHash;
  } catch {
    return false;
  }
}

export function signToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 * 30 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const [headerB64, bodyB64, signature] = token.split('.');
    if (!headerB64 || !bodyB64 || !signature) return null;
    const checkSig = crypto.createHmac('sha256', JWT_SECRET).update(`${headerB64}.${bodyB64}`).digest('base64url');
    if (signature !== checkSig) return null;
    const body = JSON.parse(Buffer.from(bodyB64, 'base64url').toString());
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}

// Full Relational Mock Database Interface
interface DatabaseSchema {
  users: User[];
  passwordHashes: Record<string, string>; // userId -> passwordHash
  customerProfiles: CustomerProfile[];
  products: Product[];
  orders: Order[];
  licenses: License[];
  downloads: DownloadInfo[];
  tickets: SupportTicket[];
  coupons: Coupon[];
  testimonials: Testimonial[];
  blogs: Blog[];
  reviews: Review[];
  payments: PaymentRecord[];
  invoices: Invoice[];
  notifications: Notification[];
  downloadCounter: number;
  languageConfigs: LanguageConfig[];
  videos: VideoTutorial[];
  solutions: SoftwareSolution[];
  razorpayConfig?: RazorpayConfig;
  helpline?: string;
  geminiApiKey?: string;
  supabaseConfig?: {
    url: string;
    anonKey: string;
    enabled: boolean;
  };
  hostingerConfig?: {
    host: string;
    user: string;
    pass: string;
    database: string;
    port: number;
    enabled: boolean;
  };
}

// In-Memory Database Instance
export let db: DatabaseSchema = {
  users: [],
  passwordHashes: {},
  customerProfiles: [],
  products: [],
  orders: [],
  licenses: [],
  downloads: [],
  tickets: [],
  coupons: [],
  testimonials: [],
  blogs: [],
  reviews: [],
  payments: [],
  invoices: [],
  notifications: [],
  downloadCounter: 1420,
  languageConfigs: [],
  videos: [],
  solutions: [],
  helpline: '+91 95169 16415',
  hostingerConfig: {
    host: '',
    user: '',
    pass: '',
    database: '',
    port: 3306,
    enabled: false
  }
};

// Seed Data
const defaultProducts: Product[] = [
  {
    id: 'prod-billing-pro',
    name: 'BSP Suryatech Retail Billing Pro',
    version: 'v4.2.1',
    size: '14.8 MB',
    price: 999,
    originalPrice: 2499,
    features: [
      'Retail & Wholesale Billing',
      'GST Invoice Generation & PDF Export',
      'Barcode Creation & Fast Scanning',
      'Inventory Stock Alerts & Tracking',
      'Customer Ledger & Balances',
      'Supplier Purchase Tracking',
      'Thermal Printer Support (58mm/80mm)',
      'Backup & Automatic Restore Settings',
      'Profit & Loss Reporting',
      'Offline Desktop-First Performance'
    ],
    description: 'All-in-one GST billing and inventory desktop software designed for Kirana stores, pharmacies, electronics shops, supermarkets, and distributors across India. Lightweight, ultra-fast, and runs 100% offline.',
    downloadUrl: '/api/downloads/setup/prod-billing-pro',
    createdAt: '2026-01-10T00:00:00Z',
    connectedPlan: 'prod-billing-pro',
    category: 'Retail & POS Billing',
    fullDescription: "BSP Suryatech Retail Billing Pro is India's leading lightweight, ultra-fast and incredibly reliable offline desktop-first billing and inventory software. It provides out-of-the-box barcode creation, wholesale/retail billing, automated tax calculation, and profit and loss registers. Designed specifically for retail shop owners to streamline billing lanes and keep inventory in perfect synchronization without requiring internet connectivity.",
    systemRequirements: 'Operating System: Windows 7 SP1, Windows 8, Windows 10, or Windows 11 (32-bit & 64-bit)\nCPU: Intel Core i3 or AMD equivalent processor (1.8Ghz minimum)\nMemory: 2 GB RAM minimum\nStorage: 100 MB free space\nDatabase: Microsoft Access or SQLite local files (Fully self-contained, auto-configured)',
    licenseInfo: 'Single-Terminal Lifetime License Key with 1 Year of free security updates and service releases.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800'
    ]
  },
  {
    id: 'prod-billing-enterprise',
    name: 'BSP Suryatech GST Enterprise Suite',
    version: 'v5.0.3',
    size: '22.4 MB',
    price: 2999,
    originalPrice: 4999,
    features: [
      'All features of Retail Billing Pro',
      'Multi-firm & Multi-branch handling',
      'Direct GST Portal JSON Export (GSTR-1, GSTR-3B)',
      'Advanced User Permissions & Roles',
      'Cloud Auto-Backup Integration',
      'Custom Print Invoice Customizer Designer',
      'Premium 24/7 Telephone Support',
      'API integration with POS Scales'
    ],
    description: 'Enterprise grade GST compliance and multi-user billing software with multi-firm support, direct GSTR ledger formatting, designable invoices, and automated backup mechanisms.',
    downloadUrl: '/api/downloads/setup/prod-billing-enterprise',
    createdAt: '2026-03-15T00:00:00Z',
    connectedPlan: 'prod-billing-enterprise',
    category: 'Enterprise GST Compliance',
    fullDescription: 'The BSP Suryatech GST Enterprise Suite is the state-of-the-art POS & Accounting platform built for Indian enterprises, wholesalers, and multi-firm operations. It handles robust multi-firm and multi-branch structures on a single workstation terminal, exports GSTR-1 & GSTR-3B compliant JSON files direct to the GST portal, schedules real-time secure Google Drive cloud backups, and empowers admins with custom visually designable invoice layout designers. Backed by enterprise-rate 24/7 priority support.',
    systemRequirements: 'Operating System: Windows 10 or Windows 11 (32-bit & 64-bit)\nCPU: Intel Core i5 or AMD Ryzen 5 or equivalent\nMemory: 4 GB RAM recommended\nStorage: 200 MB free space\nDatabase: SQLite or cloud-integrated backup storage',
    licenseInfo: 'Multi-Firm Unlimited Terminal Site License Key. Priority 24/7 Telephone and On-Site Setup consultation support included.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800'
    ]
  }
];

const defaultCoupons: Coupon[] = [
  { code: 'SURYA20', discountPercent: 20, active: true, expiresBy: '2027-12-31' },
  { code: 'INDIA50', discountPercent: 50, active: true, expiresBy: '2026-12-31' },
  { code: 'STARTUP10', discountPercent: 10, active: true, expiresBy: '2026-08-30' }
];

const defaultTestimonials: Testimonial[] = [
  {
    id: 't-1',
    name: 'Rajesh Sharma',
    company: 'Sharma Kirana Store',
    role: 'Owner',
    text: 'BSP Suryatech Billing Software completely transformed my retail store. Generating barcodes and printing thermal bills has never been faster. Our lines move 3x faster now! Extremely reliable offline.',
    rating: 5
  },
  {
    id: 't-2',
    name: 'Anjali Gupta',
    company: 'Gupta Medicals & Pharmacies',
    role: 'Chief Pharmacist',
    text: 'The drug inventory tracking and expiry date alerts are lifesaving. Plus, the automated GST reports make GSTR-1 filings a breeze. Total peace of mind for Indian business owners.',
    rating: 5
  },
  {
    id: 't-3',
    name: 'Vikram Singh',
    company: 'Singh Electronics & Hardware',
    role: 'Managing Director',
    text: 'Superb software, low learning curve, and runs flawlessly on old Windows 7 desktop terminals. The backup system works perfectly. The customer portal license activation takes 1 minute.',
    rating: 5
  }
];

const defaultBlogs: Blog[] = [
  {
    id: 'blog-1',
    title: 'How to Automate GST Return Filings for Small Retail Business in India',
    excerpt: 'Manual ledger preparation can be a nightmare. Learn how automated GST billing software generates instant error-free GSTR schemas and tables in minutes.',
    content: 'Filing Goods and Services Tax (GST) returns manually is one of the most time-consuming and error-prone administrative tasks for small Indian merchants. In this detailed guide, we explain GSTR-1, GSTR-2B, and GSTR-3B components. By using certified automated billing software, every sales transactions, CGST, SGST, IGST calculations happen instantaneously at the billing terminal, storing item rates, discount schemes, and HSN codes seamlessly. At month-end, click standard portals button to export standardized file which can be directly uploaded to local GST offline tool. Saving over 90% auditor costs annually.',
    author: 'Suraj Kumar (Developer, BSP Suryatech)',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    date: '2026-05-18',
    readTime: '6 min read'
  },
  {
    id: 'blog-2',
    title: 'Why Offline Desktop Billing is Better than Cloud Billing for Retail Shop POS',
    excerpt: 'ISP connection drops or slow cloud loading times are detrimental to grocery lanes. Find out why offline-first architectures dominate POS billing.',
    content: 'Many merchants struggle with slow billing when their internet acts up. Cloud software stops cold when cloud latency increases. An offline-first billing app like BSP Suryatech Billing ensures your scanner, keyboard, cash drawers, and printers operate continuously. Database modifications are saved instantly to local high-speed file storage. Backups are synced to cloud only when internet connections return. Keep checkout lines lightning fast even during complete ISP provider drops.',
    author: 'Praveen Shastry (Technical Lead)',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
    date: '2026-06-02',
    readTime: '5 min read'
  }
];

const defaultDownloads: DownloadInfo[] = [
  {
    id: 'dl-1',
    version: '4.2.1',
    filename: 'BSPSuryatech_BillingReader_v4.2.1_Setup.exe',
    fileSize: '14.8 MB',
    downloadUrl: '/api/downloads/setup/prod-billing-pro',
    releaseNotes: [
      'Added high-speed barcode generation routines.',
      'Improved thermal receipt text wrapping logic on 58mm POS screens.',
      'Optimized customer sales summary ledger loading times by 40%.',
      'Fixed state selector issues in purchase SGST/CGST configurations.'
    ],
    downloadCount: 840,
    createdAt: '2026-05-20T00:00:00Z'
  },
  {
    id: 'dl-2',
    version: '5.0.3',
    filename: 'BSPSuryatech_GST_Enterprise_v5.0.3_Setup.exe',
    fileSize: '22.4 MB',
    downloadUrl: '/api/downloads/setup/prod-billing-enterprise',
    releaseNotes: [
      'Added multi-firm dynamic ledger grouping.',
      'New secure Google Drive API auto-cloud backups scheduler.',
      'Added dynamic invoice layout designer visual canvas.',
      'Updated HSN reference lists for 2026 GST guidelines.'
    ],
    downloadCount: 580,
    createdAt: '2026-06-01T00:00:00Z'
  }
];

const defaultReviews: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-billing-pro',
    name: 'Manish Kumar',
    rating: 5,
    comment: 'Runs very fast. Excellent thermal printer integration out of the box!',
    createdAt: '2026-05-15T10:00:00Z'
  },
  {
    id: 'rev-2',
    productId: 'prod-billing-pro',
    name: 'Ketan Patel',
    rating: 4,
    comment: 'Best retail app for the price. The lifetime license is extremely affordable.',
    createdAt: '2026-05-22T14:30:00Z'
  }
];

const defaultVideos: VideoTutorial[] = [
  {
    id: 'vid-1',
    title: 'Complete Software Overview & POS Retail Setup Guide (v4.2.1)',
    duration: '12:45 Mins',
    youtubeId: 'bsp_overview_embed',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
    description: 'A comprehensive complete video tutorial going through initial registration, barcode creation, Adding custom tax items, setting up standard inventory levels, and executing cash bills.'
  },
  {
    id: 'vid-2',
    title: 'Configuring Thermal Receipt Printers & Paper Canvas Alignments',
    duration: '08:30 Mins',
    youtubeId: 'bsp_printer_embed',
    thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800',
    description: 'Step-by-step instructions details covering TVS, Sewoo, Epson, Rongta driver settings, adjusting paper limits parameters, line margins offset spacing, and footer text customizer layouts.'
  },
  {
    id: 'vid-3',
    title: 'Bulk Stocks Catalogue Imports Using Excel Sheet Templates',
    duration: '05:40 Mins',
    youtubeId: 'bsp_import_embed',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    description: 'How to easily compile columns in Excel sheets, configure tax rates, stock minimum levels, barcodes, and upload directly to BSP Suryatech local database with no syntax issues.'
  }
];

export const defaultSolutions: SoftwareSolution[] = [
  {
    id: 'sol-retail',
    mappedPlanId: 'prod-billing-pro',
    title: 'Retail Billing Software',
    category: 'Billing Software',
    subtitle: 'BESTSELLER FOR SHOPS',
    description: 'Secure GST invoicing, fast item lookup, barcode tags generator & scanner speed-up integrations.',
    price: 'INR 3,499',
    features: ['GST Invoicing', 'Barcode Scanner Support', 'Thermal Printer Setup', 'Offline Database State', 'Supplier & Client Ledgers'],
    icon: '🛍️',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-supermarket',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Supermarket POS Software',
    category: 'Billing Software',
    subtitle: 'COMPLETE POS PACK',
    description: 'High speed point of sales billing with barcode scanning, multiple registers support and WhatsApp notifications.',
    price: 'INR 5,999',
    features: ['High-Speed POS Checkout', 'Integrated Barcode Printing', 'Customer Loyalty Points', 'Multi-Terminal Syncing', 'Automatic Reorder Limits'],
    icon: '🏪',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-grocery',
    mappedPlanId: 'prod-billing-pro',
    title: 'Grocery Billing Software',
    category: 'Billing Software',
    subtitle: 'FAST GROCERY STORE SPECIAL',
    description: 'Designed for local grocery stores, supporting weight scales integration and fast barcode lookups.',
    price: 'INR 4,499',
    features: ['Digital Weight Scale Link', 'Barcoding & Item Lookup', 'Short Expiry Tracking', 'Multiple Payment Options', 'Dynamic POS Checkout'],
    icon: '🍎',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-medical',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Medical Store Billing Software',
    category: 'Billing Software',
    subtitle: 'PHARMACY BATCH SPECIAL',
    description: 'Secure pharmacy store ledger tracking medicines, scheduled drugs, batch expiries, lists, and doctors details.',
    price: 'INR 5,499',
    features: ['Batch Code Expiry tracking', 'Drug License verification', 'Salt-wise generic lookup', 'Supplier Invoice Sync', 'Doctor referrals lists'],
    icon: '💊',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-restaurant',
    mappedPlanId: 'prod-billing-pro',
    title: 'Restaurant POS & KOT Software',
    category: 'Billing Software',
    subtitle: 'KITCHEN & HOTEL SPECIAL',
    description: 'Streamlined table menus ordering, instantaneous kitchen order tickets dispatching, split bills, and table mappings.',
    price: 'INR 3,499',
    features: ['Kitchen Order Tickets (KOT)', 'Table Mapping & Status', 'Recipe Ingredient Control', 'Split Bill Settlements', 'Waiter Android App link'],
    icon: '🍽️',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-mobile',
    mappedPlanId: 'prod-billing-pro',
    title: 'Mobile Shop Billing Software',
    category: 'Billing Software',
    subtitle: 'IMEI & SERIAL TRACKER',
    description: 'Perfect for smartphone and electronics repair centers. Dynamic tracking of unique IMEI and serial tags.',
    price: 'INR 4,999',
    features: ['Unique IMEI/Serial logging', 'Dynamic Repairs Tracker', 'Warranty Status Records', 'Brand & Model Catalog', 'Customer AMC reminders'],
    icon: '📱',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-electronics',
    mappedPlanId: 'prod-billing-pro',
    title: 'Electronics Shop Billing Software',
    category: 'Billing Software',
    subtitle: 'APPLIANCE SPECIAL',
    description: 'Robust billing with dual-serial numbers, warranty cards distribution, and multi-location warehouse sync.',
    price: 'INR 5,999',
    features: ['Dual-Serial Code validation', 'Manufacturer Warranty link', 'Installations Scheduler', 'Commission Agent ledger', 'Multi-Godown Stock check'],
    icon: '📺',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-transport',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Transport Management Software',
    category: 'Transport Software',
    subtitle: 'LOGISTICS & FLEET STANDARD',
    description: 'Complete operations control. Manage vehicle tracking logs, trip expenses, diesel trackers, and driver payouts.',
    price: 'INR 7,999',
    features: ['Fleet Management', 'Vehicle Tracking', 'Trip Sheet expense logs', 'Driver Commission accounts', 'Client & Consignee Ledgers'],
    icon: '🚚',
    badge: 'Transport',
    badgeColor: 'blue',
    exeUrl: ''
  },
  {
    id: 'sol-hospital',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Hospital & Clinic Software',
    category: 'Hospital Software',
    subtitle: 'HEALTHCARE INTEGRATED',
    price: 'INR 12,499',
    icon: '🏥',
    badge: 'Hospital',
    badgeColor: 'red',
    description: 'In-patient/Out-patient registration, modular appointments, doctor scheduling, prescription prints, and laboratory logs.',
    features: ['OPD/IPD Patient Registry', 'Doctor Scheduler & Fees', 'EHR & Digital Prescriptions', 'Pharmacy & Lab Bilateral', 'Ward Bed Occupancy'],
    exeUrl: ''
  },
  {
    id: 'sol-diagnostic',
    mappedPlanId: 'prod-billing-pro',
    title: 'Diagnostic Lab Manager',
    category: 'Hospital Software',
    subtitle: 'PATHOLOGY LABORATORY',
    price: 'INR 8,499',
    icon: '🔬',
    badge: 'Hospital',
    badgeColor: 'red',
    description: 'Streamlined report-making logs with custom layout sheets templates, sample collection workflows, and referral networks bookkeeping.',
    features: ['Test Report Template Maker', 'Barcode Sample Tracker', 'Patient Bill & Due Receipts', 'B2B Lab Referral Account', 'Automated Analyzer Sync'],
    exeUrl: ''
  },
  {
    id: 'sol-school',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'School ERP Management Suite',
    category: 'School Software',
    subtitle: 'ACADEMIC INSTITUTIONS',
    price: 'INR 11,499',
    icon: '🏫',
    badge: 'School',
    badgeColor: 'indigo',
    description: 'Robust student lifecycle bookkeeping. Integrated fee customizer modules, grades charts, schedule grids and bus tracking.',
    features: ['Student Profile & Admissions', 'Dynamic Fee Structure Maker', 'Class Timetable Grid', 'Exam Marks & Report Cards', 'SMS & WhatsApp Notifications'],
    exeUrl: ''
  },
  {
    id: 'sol-erp-warehouse',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Enterprise ERP Suite',
    category: 'ERP Software',
    subtitle: 'SUPPLY CHAIN SUITE',
    price: 'INR 14,999',
    icon: '🏭',
    badge: 'ERP',
    badgeColor: 'purple',
    description: 'Comprehensive industrial operations platform. Multi-warehouse transfers, raw materials receipts, bills of materials tracker.',
    features: ['Multi-Warehouse Transfer Logs', 'Manufacturing Bill of Materials', 'Advanced Batch/Lot Control', 'PO & SO Purchase Orders', 'Reorder Stock Estimations'],
    exeUrl: ''
  }
];

export const defaultRazorpayConfig: RazorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_T0ExE9eOBkab4Z',
  keySecret: process.env.RAZORPAY_KEY_SECRET || 'hqIzJAAXiiTEtilVlFn8eDre',
  mode: 'live',
  currency: 'INR',
  enabled: true,
  webhookSecret: ''
};

// Initialize DB and Save
export function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      
      // Ensure seed lists exist if structural updates occurred
      if (!db.products || db.products.length === 0) db.products = defaultProducts;
      if (!db.coupons || db.coupons.length === 0) db.coupons = defaultCoupons;
      if (!db.testimonials || db.testimonials.length === 0) db.testimonials = defaultTestimonials;
      if (!db.blogs || db.blogs.length === 0) db.blogs = defaultBlogs;
      if (!db.downloads || db.downloads.length === 0) db.downloads = defaultDownloads;
      if (!db.reviews || db.reviews.length === 0) db.reviews = defaultReviews;
      if (!db.videos || db.videos.length === 0) db.videos = [...defaultVideos];
      if (!db.solutions || db.solutions.length === 0) db.solutions = [...defaultSolutions];
      if (!db.customerProfiles) db.customerProfiles = [];
      if (!db.payments) db.payments = [];
      if (!db.invoices) db.invoices = [];
      if (!db.notifications) db.notifications = [];
      if (db.downloadCounter === undefined) db.downloadCounter = 1420;
      if (!db.languageConfigs || db.languageConfigs.length === 0) {
        db.languageConfigs = [...defaultLanguageConfigs];
      }
      if (!db.razorpayConfig) {
        db.razorpayConfig = { ...defaultRazorpayConfig };
      }
      if (!db.helpline) {
        db.helpline = '+91 95169 16415';
      }

      // Force-ensure admin exists with proper credentials
      const targetAdminEmail = 'surajsurya.koo7@gmail.com';
      let adminObj = db.users.find(u => u.email && u.email.toLowerCase() === targetAdminEmail.toLowerCase());
      if (!adminObj) {
        adminObj = {
          id: 'u-admin',
          name: 'BSP Suryatech Admin',
          email: targetAdminEmail,
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        db.users.push(adminObj);
      } else {
        adminObj.role = 'admin';
      }
      db.passwordHashes[adminObj.id] = hashPassword('Admin@2016#2020');
      saveDB();
    } catch (e) {
      console.error('Error loading DB, re-seeding...', e);
      seedDB();
    }
  } else {
    seedDB();
  }
}

function seedDB() {
  db = {
    users: [],
    passwordHashes: {},
    customerProfiles: [],
    products: defaultProducts,
    orders: [],
    licenses: [],
    downloads: defaultDownloads,
    tickets: [],
    coupons: defaultCoupons,
    testimonials: defaultTestimonials,
    blogs: defaultBlogs,
    reviews: defaultReviews,
    payments: [],
    invoices: [],
    notifications: [],
    downloadCounter: 1420,
    languageConfigs: [...defaultLanguageConfigs],
    videos: [...defaultVideos],
    razorpayConfig: { ...defaultRazorpayConfig },
    helpline: '+91 95169 16415',
    solutions: defaultSolutions
  };

  // Seed default admin
  const adminId = 'u-admin';
  const adminUser: User = {
    id: adminId,
    name: 'BSP Suryatech Admin',
    email: 'surajsurya.koo7@gmail.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  db.users.push(adminUser);
  db.passwordHashes[adminId] = hashPassword('Admin@2016#2020');

  // Seed default customer
  const customerId = 'u-customer';
  const customerUser: User = {
    id: customerId,
    name: 'Suraj Kumar',
    email: 'test@gmail.com',
    role: 'customer',
    createdAt: new Date().toISOString()
  };
  db.users.push(customerUser);
  db.passwordHashes[customerId] = hashPassword('surya123'); // Simple for trial logins

  // Seed standard successful order and license for customer to see immediately
  const orderId = 'ord-seed-001';
  db.orders.push({
    id: orderId,
    userId: customerId,
    userEmail: 'test@gmail.com',
    userName: 'Suraj Kumar',
    productId: 'prod-billing-pro',
    productName: 'BSP Suryatech Retail Billing Pro',
    amount: 999,
    status: 'success',
    paymentId: 'pay_RZP_seed938475',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });

  db.licenses.push({
    id: 'lic-seed-991',
    userId: customerId,
    userEmail: 'test@gmail.com',
    orderId: orderId,
    productId: 'prod-billing-pro',
    productName: 'BSP Suryatech Retail Billing Pro',
    licenseKey: 'BSPS-RETL-PRO-K93F-92JD-L03A-84Y7',
    status: 'active',
    expiresAt: '2099-12-31T23:59:59Z', // Lifetime
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Seed default support ticket
  db.tickets.push({
    id: 'tk-seed-001',
    userId: customerId,
    userEmail: 'test@gmail.com',
    userName: 'Suraj Kumar',
    title: 'Thermal Printer Invoice Width Configuration',
    description: 'We bought a thermal physical printer brand. How to match receipt width from the software print settings? Bill currently wraps margins incorrectly.',
    category: 'Technical Bug',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    replies: [
      {
        id: 'reply-seed-1',
        authorName: 'Suraj Kumar',
        authorRole: 'customer',
        message: 'I tried 58mm receipts, but layout prints empty right margins.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'reply-seed-2',
        authorName: 'Support Team (BSP Suryatech)',
        authorRole: 'admin',
        message: 'Hello Suraj, please load Printer Properties page in Suryatech dashboard. Select "Paper Size" dropdown and set it specifically to 58mm or 80mm as suited. Click Apply settings. Let us know if this solves the wrap alignment.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  });

  // Seed customer profile records
  db.customerProfiles.push({
    userId: customerId,
    clientName: 'Suraj Kumar',
    businessName: 'Surya Enterprises POS Solutions',
    contactNumber: '9988776655',
    emailAddress: 'test@gmail.com',
    businessAddress: 'Sector 62, Noida POS Terminal Block B',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    gstNumber: '09AAACS1234A1Z5',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Seed customer payment record
  db.payments.push({
    id: 'pay-seed-001',
    invoiceNumber: 'INV-2026-001',
    transactionId: 'pay_RZP_seed938475',
    paymentMethod: 'UP_Razorpay',
    amount: 999,
    paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'captured',
    orderId,
    userId: customerId
  });

  // Seed customer invoice record
  db.invoices.push({
    id: 'inv-seed-001',
    invoiceNumber: 'INV-2026-001',
    orderId,
    userId: customerId,
    clientName: 'Suraj Kumar',
    businessName: 'Surya Enterprises POS Solutions',
    emailAddress: 'test@gmail.com',
    contactNumber: '9988776655',
    amount: 999,
    gstAmount: 152,
    netAmount: 847,
    productName: 'BSP Suryatech Retail Billing Pro',
    licenseKey: 'BSPS-RETL-PRO-K93F-92JD-L03A-84Y7',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Seed some customer notifications
  db.notifications.push({
    id: 'notif-seed-1',
    userId: customerId,
    title: 'Trial Access Verified',
    message: 'Welcome! Your Suryatech account is active. You are cleared to download free setup.exe trials.',
    type: 'security',
    read: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });
  db.notifications.push({
    id: 'notif-seed-2',
    userId: customerId,
    title: 'License Activated',
    message: 'BSP Retail Billing key BSPS-RETL-PRO-K93F-92JD-L03A-84Y7 is active on 1 workstation host.',
    type: 'license_activated',
    read: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });
  db.notifications.push({
    id: 'notif-seed-3',
    userId: customerId,
    title: 'New Update Version Available',
    message: 'Admin uploaded version 4.3.0. Please upgrade your retail workstation client.',
    type: 'new_version',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  });

  saveDB();
}

export function saveDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

  // Trigger non-blocking sync to Hostinger MySQL in background if enabled
  import('./hostinger.js')
    .then(({ isHostingerEnabled, migrateLocalDataToHostinger }) => {
      if (isHostingerEnabled()) {
        migrateLocalDataToHostinger()
          .catch((err) => console.error('Hostinger auto-sync error:', err));
      }
    })
    .catch((err) => {
      // Ignore background load failures during initialization
    });
}

// Data Access Helpers
export const dbActions = {
  getUsers: () => db.users,
  getUserById: (id: string) => db.users.find(u => u.id === id),
  getUserByEmail: (email: string) => db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()),
  getUserPasswordHash: (id: string) => db.passwordHashes[id],
  updateUserPassword: (id: string, newPass: string) => {
    db.passwordHashes[id] = hashPassword(newPass);
    saveDB();
    return true;
  },
  
  createUser: (user: Omit<User, 'id' | 'createdAt'>, pass: string) => {
    const id = 'u-' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    db.passwordHashes[id] = hashPassword(pass);
    saveDB();
    return newUser;
  },

  getProducts: () => db.products,
  getProductById: (id: string) => db.products.find(p => p.id === id),
  createProduct: (product: Omit<Product, 'id' | 'createdAt'>) => {
    const id = 'prod-' + Math.random().toString(36).substr(2, 9);
    const newProd: Product = {
      ...product,
      id,
      createdAt: new Date().toISOString()
    };
    db.products.push(newProd);
    saveDB();
    return newProd;
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const idx = db.products.findIndex(p => p.id === id);
    if (idx > -1) {
      db.products[idx] = { ...db.products[idx], ...updates };
      saveDB();
      return db.products[idx];
    }
    return null;
  },
  deleteProduct: (id: string) => {
    db.products = db.products.filter(p => p.id !== id);
    saveDB();
  },

  getOrders: () => db.orders,
  getOrdersByUser: (userId: string) => db.orders.filter(o => o.userId === userId),
  createOrder: (order: Omit<Order, 'id' | 'createdAt'>) => {
    const id = 'ord-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newOrder: Order = {
      ...order,
      id,
      createdAt: new Date().toISOString()
    };
    db.orders.push(newOrder);
    saveDB();
    return newOrder;
  },
  updateOrder: (id: string, updates: Partial<Order>) => {
    const idx = db.orders.findIndex(o => o.id === id);
    if (idx > -1) {
      db.orders[idx] = { ...db.orders[idx], ...updates };
      saveDB();
      return db.orders[idx];
    }
    return null;
  },

  getLicenses: () => db.licenses,
  getLicensesByUser: (userId: string) => db.licenses.filter(l => l.userId === userId),
  createLicense: (userId: string, userEmail: string, orderId: string, productId: string, productName: string) => {
    // Generate secure Indian format license code: BSPS-RETL-[RandomHex-XXXX-XXXX]
    const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const segment3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const key = `BSPS-RETL-${segment1}-${segment2}-${segment3}-LIFE`;

    const newKey: License = {
      id: 'lic-' + Math.random().toString(36).substr(2, 9),
      userId,
      userEmail,
      orderId,
      productId,
      productName,
      licenseKey: key,
      status: 'active',
      expiresAt: '2099-12-31T23:59:59Z',
      createdAt: new Date().toISOString()
    };
    db.licenses.push(newKey);
    saveDB();
    return newKey;
  },
  updateLicenseStatus: (id: string, status: License['status']) => {
    const lic = db.licenses.find(l => l.id === id);
    if (lic) {
      lic.status = status;
      saveDB();
    }
    return lic;
  },

  getDownloads: () => db.downloads,
  getDownloadCounter: () => db.downloadCounter,
  incrementDownloadCounter: (prodId?: string) => {
    db.downloadCounter += 1;
    if (prodId) {
      // Find specific product download item and increment
      const dl = db.downloads.find(d => d.id === prodId || d.filename.toLowerCase().includes(prodId.replace('prod-', '')));
      if (dl) {
        dl.downloadCount += 1;
      }
    }
    saveDB();
    return db.downloadCounter;
  },
  createDownloadInfo: (dl: Omit<DownloadInfo, 'id' | 'createdAt'>) => {
    const id = 'dl-' + Math.random().toString(36).substr(2, 9);
    const newDl: DownloadInfo = {
      ...dl,
      id,
      createdAt: new Date().toISOString()
    };
    db.downloads.push(newDl);
    saveDB();
    return newDl;
  },
  deleteDownloadInfo: (id: string) => {
    db.downloads = db.downloads.filter(d => d.id !== id);
    saveDB();
  },

  getTickets: () => db.tickets,
  getTicketsByUser: (userId: string) => db.tickets.filter(t => t.userId === userId),
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'replies'>) => {
    const id = 'tk-' + Math.random().toString(36).substr(2, 9);
    const newTicket: SupportTicket = {
      ...ticket,
      id,
      createdAt: new Date().toISOString(),
      replies: []
    };
    db.tickets.push(newTicket);
    saveDB();
    return newTicket;
  },
  addTicketReply: (ticketId: string, reply: Omit<TicketReply, 'id' | 'createdAt'>) => {
    const tk = db.tickets.find(t => t.id === ticketId);
    if (tk) {
      const newReply: TicketReply = {
        ...reply,
        id: 'reply-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      tk.replies.push(newReply);
      saveDB();
      return tk;
    }
    return null;
  },
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => {
    const tk = db.tickets.find(t => t.id === ticketId);
    if (tk) {
      tk.status = status;
      saveDB();
    }
    return tk;
  },

  getCoupons: () => db.coupons,
  getCouponByCode: (code: string) => db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active),
  createCoupon: (coupon: Coupon) => {
    db.coupons.push(coupon);
    saveDB();
    return coupon;
  },
  toggleCouponActive: (code: string) => {
    const cp = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (cp) {
      cp.active = !cp.active;
      saveDB();
    }
    return cp;
  },
  deleteCoupon: (code: string) => {
    db.coupons = db.coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
    saveDB();
  },

  getTestimonials: () => db.testimonials,
  createTestimonial: (test: Omit<Testimonial, 'id'>) => {
    const id = 't-' + Math.random().toString(36).substr(2, 9);
    const newTest: Testimonial = { ...test, id };
    db.testimonials.push(newTest);
    saveDB();
    return newTest;
  },
  deleteTestimonial: (id: string) => {
    db.testimonials = db.testimonials.filter(t => t.id !== id);
    saveDB();
  },

  getBlogs: () => db.blogs,
  createBlog: (blog: Omit<Blog, 'id'>) => {
    const id = 'blog-' + Math.random().toString(36).substr(2, 9);
    const newBlog: Blog = { ...blog, id };
    db.blogs.push(newBlog);
    saveDB();
    return newBlog;
  },
  deleteBlog: (id: string) => {
    db.blogs = db.blogs.filter(b => b.id !== id);
    saveDB();
  },

  getReviews: () => db.reviews,
  getReviewsByProduct: (prodId: string) => db.reviews.filter(r => r.productId === prodId),
  createReview: (review: Omit<Review, 'id' | 'createdAt'>) => {
    const id = 'rev-' + Math.random().toString(36).substr(2, 9);
    const newReview: Review = {
      ...review,
      id,
      createdAt: new Date().toISOString()
    };
    db.reviews.push(newReview);
    saveDB();
    return newReview;
  },

  getSystemStats: (): SystemStats => {
    const revenue = db.orders
      .filter(o => o.status === 'success')
      .reduce((sum, o) => sum + o.amount, 0);

    const customers = db.users.filter(u => u.role === 'customer').length;
    const orders = db.orders.length;
    const activeLic = db.licenses.filter(l => l.status === 'active').length;
    const totalDls = db.downloadCounter;
    const openTks = db.tickets.filter(t => t.status !== 'resolved').length;

    return {
      totalRevenue: revenue,
      totalCustomers: customers,
      totalOrders: orders,
      activeLicenses: activeLic,
      totalDownloads: totalDls,
      openTickets: openTks
    };
  },

  // Customer profiles
  getCustomerProfiles: () => db.customerProfiles || [],
  getCustomerProfileByUserId: (userId: string) => (db.customerProfiles || []).find(cp => cp.userId === userId),
  saveCustomerProfile: (profile: Omit<CustomerProfile, 'createdAt'>) => {
    if (!db.customerProfiles) db.customerProfiles = [];
    const existingIdx = db.customerProfiles.findIndex(cp => cp.userId === profile.userId);
    const newProfile: CustomerProfile = {
      ...profile,
      createdAt: existingIdx > -1 ? db.customerProfiles[existingIdx].createdAt : new Date().toISOString()
    };
    if (existingIdx > -1) {
      db.customerProfiles[existingIdx] = newProfile;
    } else {
      db.customerProfiles.push(newProfile);
    }
    saveDB();
    return newProfile;
  },

  // Payments Action
  getPayments: () => db.payments || [],
  getPaymentsByUser: (userId: string) => (db.payments || []).filter(p => p.userId === userId),
  createPayment: (payment: Omit<PaymentRecord, 'id'>) => {
    const id = 'pay-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newPay: PaymentRecord = { ...payment, id };
    if (!db.payments) db.payments = [];
    db.payments.push(newPay);
    saveDB();
    return newPay;
  },

  // Invoices Action
  getInvoices: () => db.invoices || [],
  getInvoicesByUser: (userId: string) => (db.invoices || []).filter(i => i.userId === userId),
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const id = 'inv-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newInv: Invoice = { ...invoice, id, createdAt: new Date().toISOString() };
    if (!db.invoices) db.invoices = [];
    db.invoices.push(newInv);
    saveDB();
    return newInv;
  },

  // Notifications Action
  getNotifications: () => db.notifications || [],
  getNotificationsByUser: (userId: string) => (db.notifications || []).filter(n => n.userId === userId),
  createNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const id = 'notif-' + Math.random().toString(36).substr(2, 9);
    const newNotif: Notification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date().toISOString()
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.push(newNotif);
    saveDB();
    return newNotif;
  },
  markNotificationRead: (id: string) => {
    if (!db.notifications) db.notifications = [];
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      saveDB();
    }
    return notif;
  },

  // Languages Action
  getLanguageConfigs: () => db.languageConfigs || [],
  toggleLanguageConfig: (code: string, enabled: boolean) => {
    if (!db.languageConfigs) db.languageConfigs = [];
    const lang = db.languageConfigs.find(l => l.code === code);
    if (lang) {
      lang.enabled = enabled;
      saveDB();
    }
    return lang;
  },
  addLanguageConfig: (lang: LanguageConfig) => {
    if (!db.languageConfigs) db.languageConfigs = [];
    const existingIdx = db.languageConfigs.findIndex(l => l.code === lang.code);
    if (existingIdx > -1) {
      db.languageConfigs[existingIdx] = lang;
    } else {
      db.languageConfigs.push(lang);
    }
    saveDB();
    return lang;
  },
  updateUserLanguage: (userId: string, language: string) => {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.language = language;
      saveDB();
    }
    return user;
  },

  // Videos Actions
  getVideoTutorials: () => db.videos || [],
  createVideoTutorial: (video: Omit<VideoTutorial, 'id' | 'createdAt'>) => {
    const id = 'vid-' + Math.random().toString(36).substr(2, 9);
    const newVid: VideoTutorial = {
      ...video,
      id,
      createdAt: new Date().toISOString()
    };
    if (!db.videos) db.videos = [];
    db.videos.push(newVid);
    saveDB();
    return newVid;
  },
  updateVideoTutorial: (id: string, updates: Partial<VideoTutorial>) => {
    if (!db.videos) db.videos = [];
    const idx = db.videos.findIndex(v => v.id === id);
    if (idx > -1) {
      db.videos[idx] = { ...db.videos[idx], ...updates };
      saveDB();
      return db.videos[idx];
    }
    return null;
  },
  deleteVideoTutorial: (id: string) => {
    if (!db.videos) db.videos = [];
    db.videos = db.videos.filter(v => v.id !== id);
    saveDB();
    return true;
  },

  getRazorpayConfig: () => {
    if (!db.razorpayConfig) {
      db.razorpayConfig = { ...defaultRazorpayConfig };
      saveDB();
    }
    const config = { ...db.razorpayConfig };
    if (process.env.RAZORPAY_KEY_ID) {
      config.keyId = process.env.RAZORPAY_KEY_ID;
    }
    if (process.env.RAZORPAY_KEY_SECRET) {
      config.keySecret = process.env.RAZORPAY_KEY_SECRET;
    }
    if (!config.keyId || config.keyId === '' || config.keyId === 'YOUR_KEY_ID') {
      config.keyId = 'rzp_live_T0ExE9eOBkab4Z';
    }
    if (!config.keySecret || config.keySecret === '' || config.keySecret === 'YOUR_SECRET') {
      config.keySecret = 'hqIzJAAXiiTEtilVlFn8eDre';
    }
    return config;
  },
  updateRazorpayConfig: (updates: Partial<RazorpayConfig>) => {
    if (!db.razorpayConfig) {
      db.razorpayConfig = { ...defaultRazorpayConfig };
    }
    db.razorpayConfig = { ...db.razorpayConfig, ...updates };
    saveDB();
    return db.razorpayConfig;
  },
  getHelpline: () => {
    return db.helpline || '+91 95169 16415';
  },
  updateHelpline: (number: string) => {
    db.helpline = number;
    saveDB();
    return db.helpline;
  },
  getGeminiConfig: () => {
    return {
      apiKey: db.geminiApiKey || ''
    };
  },
  updateGeminiConfig: (apiKey: string) => {
    db.geminiApiKey = apiKey;
    saveDB();
    return { apiKey };
  },
  getSupabaseConfig: () => {
    return db.supabaseConfig || { url: '', anonKey: '', enabled: false };
  },
  updateSupabaseConfig: (updates: { url: string; anonKey: string; enabled: boolean }) => {
    db.supabaseConfig = {
      url: updates.url || '',
      anonKey: updates.anonKey || '',
      enabled: !!updates.enabled
    };
    saveDB();
    return db.supabaseConfig;
  },
  getHostingerConfig: () => {
    return (db as any).hostingerConfig || { host: '', user: '', pass: '', database: '', port: 3306, enabled: false };
  },
  updateHostingerConfig: (updates: { host: string; user: string; pass: string; database: string; port: number; enabled: boolean }) => {
    (db as any).hostingerConfig = {
      host: updates.host || '',
      user: updates.user || '',
      pass: updates.pass || '',
      database: updates.database || '',
      port: Number(updates.port) || 3306,
      enabled: !!updates.enabled
    };
    saveDB();
    return (db as any).hostingerConfig;
  },

  // Solutions actions
  getSolutions: () => db.solutions || [],
  createSolution: (sol: Omit<SoftwareSolution, 'id'>) => {
    const id = 'sol-' + Math.random().toString(36).substr(2, 9);
    const newSol: SoftwareSolution = {
      ...sol,
      id
    };
    if (!db.solutions) db.solutions = [];
    db.solutions.push(newSol);
    saveDB();
    return newSol;
  },
  updateSolution: (id: string, updates: Partial<SoftwareSolution>) => {
    if (!db.solutions) db.solutions = [];
    const idx = db.solutions.findIndex(s => s.id === id);
    if (idx > -1) {
      db.solutions[idx] = { ...db.solutions[idx], ...updates };
      saveDB();
      return db.solutions[idx];
    }
    return null;
  },
  deleteSolution: (id: string) => {
    if (!db.solutions) db.solutions = [];
    db.solutions = db.solutions.filter(s => s.id !== id);
    saveDB();
    return true;
  }
};

// Auto-run DB init on import
initDB();
