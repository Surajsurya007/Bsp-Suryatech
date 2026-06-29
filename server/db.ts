/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Product, Order, License, DownloadInfo, SupportTicket, Coupon, CouponRedemption, Testimonial, Blog, Review, TicketReply, SystemStats, CustomerProfile, PaymentRecord, Invoice, Notification, LanguageConfig, VideoTutorial, SoftwareSolution, SoftwareCategory } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// JWT Secret
export const JWT_SECRET = process.env.JWT_SECRET || 'bsp_secret_key';

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

export const defaultCategories: SoftwareCategory[] = [
  { id: 'cat-billing', name: 'Billing Software', displayOrder: 1 },
  { id: 'cat-transport', name: 'Transport Software', displayOrder: 2 },
  { id: 'cat-hospital', name: 'Hospital Software', displayOrder: 3 },
  { id: 'cat-school', name: 'School Software', displayOrder: 4 },
  { id: 'cat-erp', name: 'ERP Software', displayOrder: 5 },
  { id: 'cat-pharmacy', name: 'Pharmacy Software', displayOrder: 6 },
  { id: 'cat-restaurant', name: 'Restaurant Software', displayOrder: 7 },
  { id: 'cat-warehouse', name: 'Warehouse Software', displayOrder: 8 }
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
    
    // 1. Check custom HS256 signature
    const checkSig = crypto.createHmac('sha256', JWT_SECRET).update(`${headerB64}.${bodyB64}`).digest('base64url');
    if (signature === checkSig) {
      const body = JSON.parse(Buffer.from(bodyB64, 'base64url').toString());
      if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
      return body;
    }

    // 2. Fallback: decode without signature verification for Supabase JWT or external sign-in tokens
    const body = JSON.parse(Buffer.from(bodyB64, 'base64url').toString());
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) {
      console.warn("verifyToken: Token structure is valid, but expired.");
      return null;
    }
    
    console.log("verifyToken: Valid external JWT parsed (Supabase fallback mapped):", body.email || body.sub);
    return {
      id: body.sub || body.id || 'u-admin',
      email: body.email || 'surajsurya.koo7@gmail.com',
      name: body.user_metadata?.full_name || body.user_metadata?.name || body.name || (body.email ? body.email.split('@')[0] : 'Suraj'),
      role: body.role || 'authenticated'
    };
  } catch (err) {
    console.error("verifyToken fallback decode error:", err);
    return null;
  }
}

// Full Relational Mock Database Interface
interface DatabaseSchema {
  users: User[];
  passwordHashes: Record<string, string>; // userId -> passwordHash
  customerProfiles: CustomerProfile[];
  products: Product[];
  categories: SoftwareCategory[];
  orders: Order[];
  licenses: License[];
  downloads: DownloadInfo[];
  tickets: SupportTicket[];
  coupons: Coupon[];
  couponRedemptions: CouponRedemption[];
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
  contactMessages?: any[];
}

// In-Memory Database Instance
export let db: DatabaseSchema = {
  users: [],
  passwordHashes: {},
  customerProfiles: [],
  products: [],
  categories: [],
  orders: [],
  licenses: [],
  downloads: [],
  tickets: [],
  coupons: [],
  couponRedemptions: [],
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
  contactMessages: [],
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
    price: 3000,
    originalPrice: 6999,
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
    category: 'Billing Software',
    fullDescription: "BSP Suryatech Retail Billing Pro is India's leading lightweight, ultra-fast and incredibly reliable offline desktop-first billing and inventory software. It provides out-of-the-box barcode creation, wholesale/retail billing, automated tax calculation, and profit and loss registers. Designed specifically for retail shop owners to streamline billing lanes and keep inventory in perfect synchronization without requiring internet connectivity.",
    systemRequirements: 'Operating System: Windows 7 SP1, Windows 8, Windows 10, or Windows 11 (32-bit & 64-bit)\nCPU: Intel Core i3 or AMD equivalent processor (1.8Ghz minimum)\nMemory: 2 GB RAM minimum\nStorage: 100 MB free space\nDatabase: Microsoft Access or SQLite local files (Fully self-contained, auto-configured)',
    licenseInfo: 'Single-Terminal Lifetime License Key with 1 Year of free security updates and service releases.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '🛍️',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
    bannerUrl: 'https://images.unsplash.com/photo-1556740738-afe6f3816a5d?auto=format&fit=crop&q=80&w=800',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-billing-pro',
    setupExeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: true,
    isBestseller: true,
    isHidden: false,
    displayOrder: 1,
    isPinned: true
  },
  {
    id: 'prod-billing-enterprise',
    name: 'BSP Suryatech GST Enterprise Suite',
    version: 'v5.0.3',
    size: '22.4 MB',
    price: 3000,
    originalPrice: 6999,
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
    category: 'ERP Software',
    fullDescription: 'The BSP Suryatech GST Enterprise Suite is the state-of-the-art POS & Accounting platform built for Indian enterprises, wholesalers, and multi-firm operations. It handles robust multi-firm and multi-branch structures on a single workstation terminal, exports GSTR-1 & GSTR-3B compliant JSON files direct to the GST portal, schedules real-time secure Google Drive cloud backups, and empowers admins with custom visually designable invoice layout designers. Backed by enterprise-rate 24/7 priority support.',
    systemRequirements: 'Operating System: Windows 10 or Windows 11 (32-bit & 64-bit)\nCPU: Intel Core i5 or AMD Ryzen 5 or equivalent\nMemory: 4 GB RAM recommended\nStorage: 200 MB free space\nDatabase: SQLite or cloud-integrated backup storage',
    licenseInfo: 'Multi-Firm Unlimited Terminal Site License Key. Priority 24/7 Telephone and On-Site Setup consultation support included.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '🏢',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800',
    bannerUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-billing-enterprise',
    setupExeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: false,
    isBestseller: true,
    isHidden: false,
    displayOrder: 2,
    isPinned: false
  },
  {
    id: 'prod-restaurant-pos',
    name: 'Restaurant POS & KOT Software',
    version: 'v1.4.2',
    size: '12.6 MB',
    price: 3000,
    originalPrice: 6999,
    features: [
      'Kitchen Order Tickets (KOT) Direct Printing',
      'Live Table Status Mapping & Visual Layouts',
      'Recipe Ingredient & Inventory Cost Control',
      'Multi-terminal Billing lane split settlements',
      'Android Captain / Waiter menu app syncing',
      'Dynamic item discount with custom taxes support'
    ],
    description: 'Streamlined table menus ordering, instantaneous kitchen order tickets dispatching, split bills, and table mappings.',
    downloadUrl: '/api/downloads/setup/prod-restaurant-pos',
    createdAt: '2026-04-18T00:00:00Z',
    connectedPlan: 'prod-restaurant-pos',
    category: 'Restaurant Software',
    fullDescription: 'Manage busy dinner rushes with incredible confidence. BSP restaurant core software coordinates table timelines, fires KOT receipts directly to correct kitchen channels, monitors ingredient stock levels in real-time, splits table tickets during checkout, and syncs smoothly with waiter handheld machines.',
    systemRequirements: 'OS: Windows 8/10/11\nMemory: 2 GB RAM minimum\nStorage: 100 MB minimum',
    licenseInfo: 'Single-Terminal Lifetime License Key with free security updates.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '🍽️',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-restaurant-pos',
    setupExeUrl: 'https://bspsuryatech.in/downloads/BSP-Restaurant-POS-KOT-v1.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: false,
    isBestseller: true,
    isHidden: false,
    displayOrder: 3,
    isPinned: false
  },
  {
    id: 'prod-mobile-billing',
    name: 'Mobile Shop Billing Software',
    version: 'v2.1.0',
    size: '11.2 MB',
    price: 3000,
    originalPrice: 6999,
    features: [
      'IMEI, ESN & Serial number tracking logs',
      'Dynamic Repairs & Job-Card tracking pipeline',
      'Warranty status records with brand logs',
      'Customer AMC service text reminders',
      'Supplier serial matching and replacement checks'
    ],
    description: 'Perfect for smartphone and electronics repair centers. Dynamic tracking of unique IMEI and serial tags.',
    downloadUrl: '/api/downloads/setup/prod-mobile-billing',
    createdAt: '2026-05-10T00:00:00Z',
    connectedPlan: 'prod-mobile-billing',
    category: 'Billing Software',
    fullDescription: 'Custom-tailored smartphone retail ERP. Log serial details of handset devices, manage workshop repair statuses, prints barcode labels directly for repair tickets, tracks outstanding vendor return credits and notifies clients of pending handovers.',
    systemRequirements: 'OS: Windows 7/8/10/11\nMemory: 2 GB RAM minimum',
    licenseInfo: 'Single-Terminal Lifetime License Key.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '📱',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-mobile-billing',
    setupExeUrl: 'https://bspsuryatech.in/downloads/Mobile-Shop-Billing-v1.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: true,
    isBestseller: false,
    isHidden: false,
    displayOrder: 4,
    isPinned: false
  },
  {
    id: 'prod-electronics-billing',
    name: 'Electronics Shop Billing Software',
    version: 'v3.0.0',
    size: '15.4 MB',
    price: 3000,
    originalPrice: 6999,
    features: [
      'Dual-Serial Number validation safeguards',
      'Manufacturer Warranty portal linking',
      'Installation schedules and technician ledgers',
      'Commission agent tracking schemes',
      'Multi-warehouse stock balancing mechanisms'
    ],
    description: 'Robust billing with dual-serial numbers, warranty cards distribution, and multi-location warehouse sync.',
    downloadUrl: '/api/downloads/setup/prod-electronics-billing',
    createdAt: '2026-05-15T00:00:00Z',
    connectedPlan: 'prod-electronics-billing',
    category: 'Billing Software',
    fullDescription: 'Heavy-duty workstation software for appliance, battery, and electrical dealerships. Handles multi-godown stock distribution, calculates complex sales rep commissions, schedules installation teams, and catalogs specific service parameters.',
    systemRequirements: 'OS: Windows 10/11\nMemory: 4 GB RAM recommended',
    licenseInfo: 'Unlimited lifetime workstation license.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '📺',
    thumbnailUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-electronics-billing',
    setupExeUrl: 'https://bspsuryatech.in/downloads/Electronics-Shop-Billing-v1.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: false,
    isBestseller: false,
    isHidden: false,
    displayOrder: 5,
    isPinned: false
  },
  {
    id: 'prod-transport-management',
    name: 'Transport Management Software',
    version: 'v1.4.0',
    size: '18.2 MB',
    price: 3000,
    originalPrice: 6999,
    features: [
      'Comprehensive Fleet logging system',
      'Vehicle maintenance and trip sheet entries',
      'Diesel expense trackers with fuel pump ledgers',
      'Driver commissions and cash advancement accounts',
      'Client bilti (L/R) generation and bills compiling'
    ],
    description: 'Complete operations control. Manage vehicle tracking logs, trip expenses, diesel trackers, and driver payouts.',
    downloadUrl: '/api/downloads/setup/prod-transport-management',
    createdAt: '2026-05-20T00:00:00Z',
    connectedPlan: 'prod-transport-management',
    category: 'Transport Software',
    fullDescription: 'The supreme command center for fleet and booking agencies. Handles vehicle trip sheets, issues precise L/R documents, manages diesel cards, checks outstanding client bills, keeps driver accounts balanced, and records tire/battery replacements.',
    systemRequirements: 'OS: Windows 10/11 (32 or 64-bit)\nMemory: 4 GB RAM recommended',
    licenseInfo: 'Lifetime License Key.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '🚚',
    thumbnailUrl: 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=400',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-transport-management',
    setupExeUrl: 'https://bspsuryatech.in/downloads/SafeWheels-ERP-v1.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: false,
    isBestseller: true,
    isHidden: false,
    displayOrder: 6,
    isPinned: false
  },
  {
    id: 'prod-hospital-clinic',
    name: 'Hospital & Clinic Software',
    version: 'v3.1.2',
    size: '25.6 MB',
    price: 3000,
    originalPrice: 6999,
    features: [
      'OPD patient registries with fast lookups',
      'Inpatient Bed and ward scheduling dashboards',
      'Electronic prescriptions & medicine histories',
      'Diagnostic laboratory report generator modules',
      'Hospital billing schemas with custom expense rates'
    ],
    description: 'In-patient/Out-patient registration, modular appointments, doctor scheduling, prescription prints, and laboratory logs.',
    downloadUrl: '/api/downloads/setup/prod-hospital-clinic',
    createdAt: '2026-05-22T00:00:00Z',
    connectedPlan: 'prod-hospital-clinic',
    category: 'Hospital Software',
    fullDescription: 'All-inclusive medical clinic workstation software. Speeds up patient registration, maps appointments, generates digital prescription sheets with rapid medicine lookup triggers, and calculates patient discharge summaries.',
    systemRequirements: 'OS: Windows 10/11\nMemory: 4 GB RAM recommended',
    licenseInfo: 'Server node Lifetime Key.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '🏥',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-hospital-clinic',
    setupExeUrl: 'https://bspsuryatech.in/downloads/Hospital-Management-ERP-v3.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: false,
    isBestseller: false,
    isHidden: false,
    displayOrder: 7,
    isPinned: false
  },
  {
    id: 'prod-school-erp',
    name: 'School ERP Management Suite',
    version: 'v2.8.0',
    size: '28.4 MB',
    price: 3000,
    originalPrice: 6999,
    features: [
      'Comprehensive Student admissions logging',
      'Configurable fee headers and receipts maker',
      'Exams and marks ledger registers',
      'Dynamic timetable schedule creator modules',
      'Automated SMS alert gateways dispatcher'
    ],
    description: 'Robust student lifecycle bookkeeping. Integrated fee customizer modules, grades charts, schedule grids and bus tracking.',
    downloadUrl: '/api/downloads/setup/prod-school-erp',
    createdAt: '2026-05-25T00:00:00Z',
    connectedPlan: 'prod-school-erp',
    category: 'School Software',
    fullDescription: 'Coordinate administrative processes effortlessly. Oversee dynamic student accounts, manage detailed fee headings, schedule term examinations, log visual mark registers and keep parents connected via automated updates.',
    systemRequirements: 'OS: Windows 10/11\nMemory: 4 GB RAM recommended',
    licenseInfo: 'Campus Lifetime site key.',
    demoVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800'
    ],
    manualUrl: '',
    status: 'active',
    logoUrl: '🏫',
    thumbnailUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=400',
    buyNowLink: '',
    learnMoreLink: '',
    trialDownloadUrl: '/api/downloads/setup/prod-school-erp',
    setupExeUrl: 'https://bspsuryatech.in/downloads/School-Management-ERP-v3.0.0.Setup.exe',
    showInDownloadCenter: true,
    isFeatured: true,
    isNewArrival: false,
    isBestseller: false,
    isHidden: false,
    displayOrder: 8,
    isPinned: false
  }
];

const defaultCoupons: Coupon[] = [
  {
    id: 'cp-surya001',
    coupon_code: 'SURYA001',
    coupon_name: 'Special ₹1.00 Override Promo',
    description: 'Forces total cart bill payable to exactly ₹1.00 regardless of original price.',
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
  },
  {
    id: 'cp-1',
    coupon_code: 'SURYA20',
    coupon_name: 'Surya Holiday Special',
    description: 'Get an instant 20% discount on all software licenses.',
    discount_type: 'percentage',
    discount_value: 20,
    max_discount: 1000,
    min_order_value: 499,
    valid_from: '2026-01-01',
    valid_to: '2027-12-31',
    usage_limit: 100,
    used_count: 0,
    per_user_limit: 1,
    status: 'active',
    created_at: '2026-01-01T12:00:00Z',
    code: 'SURYA20',
    discountPercent: 20,
    active: true,
    expiresBy: '2027-12-31'
  },
  {
    id: 'cp-2',
    coupon_code: 'INDIA50',
    coupon_name: 'India Independence Celebration',
    description: 'Special 50% discount on Enterprise and Retail versions.',
    discount_type: 'percentage',
    discount_value: 50,
    max_discount: 5000,
    min_order_value: 2000,
    valid_from: '2026-01-01',
    valid_to: '2026-12-31',
    usage_limit: 500,
    used_count: 0,
    per_user_limit: 2,
    status: 'active',
    created_at: '2026-01-01T12:00:00Z',
    code: 'INDIA50',
    discountPercent: 50,
    active: true,
    expiresBy: '2026-12-31'
  },
  {
    id: 'cp-3',
    coupon_code: 'STARTUP10',
    coupon_name: 'Small Business Incentive Program',
    description: '10% discount to empower local Indian software setups.',
    discount_type: 'percentage',
    discount_value: 10,
    max_discount: 300,
    min_order_value: 100,
    valid_from: '2026-01-01',
    valid_to: '2026-08-30',
    usage_limit: 1000,
    used_count: 0,
    per_user_limit: 5,
    status: 'active',
    created_at: '2026-01-01T12:00:00Z',
    code: 'STARTUP10',
    discountPercent: 10,
    active: true,
    expiresBy: '2026-08-30'
  }
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
    price: '₹3,000',
    features: ['GST Invoicing', 'Barcode Scanner Support', 'Thermal Printer Setup', 'Offline Database State', 'Supplier & Client Ledgers'],
    icon: '🛍️',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-supermarket',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Supermarket POS Software',
    category: 'Billing Software',
    subtitle: 'COMPLETE POS PACK',
    description: 'High speed point of sales billing with barcode scanning, multiple registers support and WhatsApp notifications.',
    price: '₹3,000',
    features: ['High-Speed POS Checkout', 'Integrated Barcode Printing', 'Customer Loyalty Points', 'Multi-Terminal Syncing', 'Automatic Reorder Limits'],
    icon: '🏪',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-grocery',
    mappedPlanId: 'prod-billing-pro',
    title: 'Grocery Billing Software',
    category: 'Billing Software',
    subtitle: 'FAST GROCERY STORE SPECIAL',
    description: 'Designed for local grocery stores, supporting weight scales integration and fast barcode lookups.',
    price: '₹3,000',
    features: ['Digital Weight Scale Link', 'Barcoding & Item Lookup', 'Short Expiry Tracking', 'Multiple Payment Options', 'Dynamic POS Checkout'],
    icon: '🍎',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-medical',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Medical Store Billing Software',
    category: 'Billing Software',
    subtitle: 'PHARMACY BATCH SPECIAL',
    description: 'Secure pharmacy store ledger tracking medicines, scheduled drugs, batch expiries, lists, and doctors details.',
    price: '₹3,000',
    features: ['Batch Code Expiry tracking', 'Drug License verification', 'Salt-wise generic lookup', 'Supplier Invoice Sync', 'Doctor referrals lists'],
    icon: '💊',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/Medical-Store-ERP-v3.0.0.Setup.exe'
  },
  {
    id: 'sol-restaurant',
    mappedPlanId: 'prod-billing-pro',
    title: 'Restaurant POS & KOT Software',
    category: 'Billing Software',
    subtitle: 'KITCHEN & HOTEL SPECIAL',
    description: 'Streamlined table menus ordering, instantaneous kitchen order tickets dispatching, split bills, and table mappings.',
    price: '₹3,000',
    features: ['Kitchen Order Tickets (KOT)', 'Table Mapping & Status', 'Recipe Ingredient Control', 'Split Bill Settlements', 'Waiter Android App link'],
    icon: '🍽️',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Restaurant-POS-KOT-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-mobile',
    mappedPlanId: 'prod-billing-pro',
    title: 'Mobile Shop Billing Software',
    category: 'Billing Software',
    subtitle: 'IMEI & SERIAL TRACKER',
    description: 'Perfect for smartphone and electronics repair centers. Dynamic tracking of unique IMEI and serial tags.',
    price: '₹3,000',
    features: ['Unique IMEI/Serial logging', 'Dynamic Repairs Tracker', 'Warranty Status Records', 'Brand & Model Catalog', 'Customer AMC reminders'],
    icon: '📱',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/Mobile-Shop-Billing-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-electronics',
    mappedPlanId: 'prod-billing-pro',
    title: 'Electronics Shop Billing Software',
    category: 'Billing Software',
    subtitle: 'APPLIANCE SPECIAL',
    description: 'Robust billing with dual-serial numbers, warranty cards distribution, and multi-location warehouse sync.',
    price: '₹3,000',
    features: ['Dual-Serial Code validation', 'Manufacturer Warranty link', 'Installations Scheduler', 'Commission Agent ledger', 'Multi-Godown Stock check'],
    icon: '📺',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/Electronics-Shop-Billing-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-transport',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Transport Management Software',
    category: 'Transport Software',
    subtitle: 'LOGISTICS & FLEET STANDARD',
    description: 'Complete operations control. Manage vehicle tracking logs, trip expenses, diesel trackers, and driver payouts.',
    price: '₹3,000',
    features: ['Fleet Management', 'Vehicle Tracking', 'Trip Sheet expense logs', 'Driver Commission accounts', 'Client & Consignee Ledgers'],
    icon: '🚚',
    badge: 'Transport',
    badgeColor: 'blue',
    exeUrl: 'https://bspsuryatech.in/downloads/SafeWheels-ERP-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-hospital',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Hospital & Clinic Software',
    category: 'Hospital Software',
    subtitle: 'HEALTHCARE INTEGRATED',
    description: 'In-patient/Out-patient registration, modular appointments, doctor scheduling, prescription prints, and laboratory logs.',
    price: '₹3,000',
    features: ['OPD/IPD Patient Registry', 'Doctor Scheduler & Fees', 'EHR & Digital Prescriptions', 'Pharmacy & Lab Bilateral', 'Ward Bed Occupancy'],
    icon: '🏥',
    badge: 'Hospital',
    badgeColor: 'red',
    exeUrl: 'https://bspsuryatech.in/downloads/Hospital-Management-ERP-v3.0.0.Setup.exe'
  },
  {
    id: 'sol-diagnostic',
    mappedPlanId: 'prod-billing-pro',
    title: 'Diagnostic Lab Manager',
    category: 'Hospital Software',
    subtitle: 'PATHOLOGY LABORATORY',
    description: 'Streamlined report-making logs with custom layout sheets templates, sample collection workflows, and referral networks bookkeeping.',
    price: '₹3,000',
    features: ['Test Report Template Maker', 'Barcode Sample Tracker', 'Patient Bill & Due Receipts', 'B2B Lab Referral Account', 'Automated Analyzer Sync'],
    icon: '🔬',
    badge: 'Hospital',
    badgeColor: 'red',
    exeUrl: 'https://bspsuryatech.in/downloads/Laboratory-Management-ERP-v3.0.0.Setup.exe'
  },
  {
    id: 'sol-school',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'School ERP Management Suite',
    category: 'School Software',
    subtitle: 'ACADEMIC INSTITUTIONS',
    description: 'Robust student lifecycle bookkeeping. Integrated fee customizer modules, grades charts, schedule grids and bus tracking.',
    price: '₹3,000',
    features: ['Student Profile & Admissions', 'Dynamic Fee Structure Maker', 'Class Timetable Grid', 'Exam Marks & Report Cards', 'SMS & WhatsApp Notifications'],
    icon: '🏫',
    badge: 'School',
    badgeColor: 'indigo',
    exeUrl: 'https://bspsuryatech.in/downloads/School-Management-ERP-v3.0.0.Setup.exe'
  },
  {
    id: 'sol-erp-warehouse',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Enterprise ERP Suite',
    category: 'ERP Software',
    subtitle: 'SUPPLY CHAIN SUITE',
    description: 'Comprehensive industrial operations platform. Multi-warehouse transfers, raw materials receipts, bills of materials tracker.',
    price: '₹3,000',
    features: ['Multi-Warehouse Transfer Logs', 'Manufacturing Bill of Materials', 'Advanced Batch/Lot Control', 'PO & SO Purchase Orders', 'Reorder Stock Estimations'],
    icon: '🏭',
    badge: 'ERP',
    badgeColor: 'purple',
    exeUrl: 'https://bspsuryatech.in/downloads/Inventory-Management-ERP-v3.0.0.Setup.exe'
  },
  {
    id: 'sol-hotel',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Hotel Management ERP',
    category: 'ERP Software',
    subtitle: 'HOTEL & HOSPITALITY SUITE',
    description: 'Complete hotel checkout, room booking slots, check-in, housekeeping scheduler, guest ledgers, and seasonal tariff planners.',
    price: '₹3,000',
    features: ['Room Reservation Booking', 'Check-in & Check-out Folios', 'Housekeeping Scheduler', 'Laundry & Restaurant KOT Billing', 'Guest Ledger accounting'],
    icon: '🏨',
    badge: 'ERP',
    badgeColor: 'purple',
    exeUrl: 'https://bspsuryatech.in/downloads/Hotel-Management-ERP-v3.0.0.Setup.exe'
  },
  {
    id: 'sol-repairing',
    mappedPlanId: 'prod-billing-pro',
    title: 'Electrical & Repairing Shop',
    category: 'Billing Software',
    subtitle: 'SERVICE & WORKSHOP FLOW',
    description: 'Specialized billing for electrical products, repairing job-cards logs, warranty claims, service reminders, and customer accounts ledger.',
    price: '₹3,000',
    features: ['Repairing Job-Cards Logs', 'Electrical Inventory Ledger', 'Serial / IMEI Warranty tracking', 'Technician Status Progress', 'Service SMS/WhatsApp alerts'],
    icon: '🔌',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-SuryaTech-Flow-ERP-v1.0.0.Setup.exe'
  },
  {
    id: 'sol-resort',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Resort & Spa PMS',
    category: 'ERP Software',
    subtitle: 'RESORT & PROPERTY PMS',
    description: 'All-in-one resort property management. Online booking syncer, visual room availability grid, spa booking scheduler, table reservation, and guest CRM.',
    price: '₹3,000',
    features: ['Visual Room Availability Grid', 'Integrated Spa & Activity slots', 'Housekeeping & Maintenance status', 'Banquet & Event bookings planner', 'Fast Check-out & Ledger folio'],
    icon: '🌴',
    badge: 'ERP',
    badgeColor: 'purple',
    exeUrl: 'https://bspsuryatech.in/downloads/Resort-Spa-PMS-v3.0.0.Setup.exe'
  },
  {
    id: 'sol-jewelry',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Jewelry Shop ERP Software',
    category: 'Billing Software',
    subtitle: 'GOLD, SILVER & ORNAMENT ERP',
    description: 'Advanced jewelry inventory software tracking gold/silver weight (carats, grams), stone weight, making charges, purity (hallmark), and dynamic daily metal rate updates.',
    price: '₹3,000',
    features: ['Dynamic Metal Rate updates', 'Purity & Karat configuration', 'Making Charges & Waste calculations', 'Hallmarked HUID Barcoding', 'Old Gold Exchange Ledger'],
    icon: '💎',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/Jewelry-Shop-ERP-v3.0.0.zip'
  }
];

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
      if (!db.products || db.products.length <= 2) {
        db.products = defaultProducts;
      }
      if (!db.categories || db.categories.length === 0) db.categories = [...defaultCategories];
      if (!db.coupons || db.coupons.length === 0) db.coupons = defaultCoupons;
      if (!db.couponRedemptions) db.couponRedemptions = [];

      // Map loaded coupons to rich form if any legacy entries are found
      db.coupons = db.coupons.map(c => {
        if (!c.coupon_code) {
          const mainCode = c.code || 'COUPON';
          return {
            ...c,
            id: c.id || `cp-${Math.random().toString(36).substr(2, 9)}`,
            coupon_code: mainCode,
            coupon_name: c.coupon_name || `${mainCode} Promo`,
            description: c.description || 'Promo discount code',
            discount_type: 'percentage',
            discount_value: c.discountPercent || 10,
            max_discount: 1000,
            min_order_value: 0,
            valid_from: '2026-01-01',
            valid_to: c.expiresBy || '2027-12-31',
            usage_limit: 1000,
            used_count: c.used_count || 0,
            per_user_limit: 1,
            status: c.active ? 'active' : 'disabled',
            created_at: c.created_at || new Date().toISOString(),
            code: mainCode,
            discountPercent: c.discountPercent || 10,
            active: c.active === undefined ? true : c.active,
            expiresBy: c.expiresBy || '2027-12-31'
          };
        }
        return c;
      });
      if (!db.testimonials || db.testimonials.length === 0) db.testimonials = defaultTestimonials;
      if (!db.blogs || db.blogs.length === 0) db.blogs = defaultBlogs;
      if (!db.downloads || db.downloads.length === 0) db.downloads = defaultDownloads;
      if (!db.reviews || db.reviews.length === 0) db.reviews = defaultReviews;
      if (!db.videos || db.videos.length === 0) db.videos = [...defaultVideos];
      
      if (!db.solutions || db.solutions.length === 0) {
        db.solutions = [...defaultSolutions];
      } else {
        // Enforce all 14 standard solutions and keep them updated with latest data
        defaultSolutions.forEach(defSol => {
          const exIdx = db.solutions.findIndex(s => s.id === defSol.id);
          if (exIdx === -1) {
            db.solutions.push(defSol);
          } else {
            db.solutions[exIdx] = {
              ...db.solutions[exIdx],
              ...defSol
            };
          }
        });
      }
      if (!db.customerProfiles) db.customerProfiles = [];
      if (!db.payments) db.payments = [];
      if (!db.invoices) db.invoices = [];
      if (!db.notifications) db.notifications = [];
      if (!db.contactMessages) db.contactMessages = [];
      if (db.downloadCounter === undefined) db.downloadCounter = 1420;
      if (!db.languageConfigs || db.languageConfigs.length === 0) {
        db.languageConfigs = [...defaultLanguageConfigs];
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
    categories: [...defaultCategories],
    orders: [],
    licenses: [],
    downloads: defaultDownloads,
    tickets: [],
    coupons: defaultCoupons,
    couponRedemptions: [],
    testimonials: defaultTestimonials,
    blogs: defaultBlogs,
    reviews: defaultReviews,
    payments: [],
    invoices: [],
    notifications: [],
    downloadCounter: 1420,
    languageConfigs: [...defaultLanguageConfigs],
    videos: [...defaultVideos],
    helpline: '+91 95169 16415',
    solutions: defaultSolutions,
    contactMessages: [
      {
        id: 'BSP-2026-000001',
        full_name: 'Amit Singhal',
        email: 'amit@singhalretail.com',
        phone: '+91 98100 23456',
        topic_category: 'Buying Query (Software Licenses)',
        message_description: 'We are setting up 3 new POS lanes in our grocery store in Sector 18 Raipur. We are interested in purchasing the Retail Billing Pro licenses. Please send us a price quote for a bulk purchase of 3 licenses and advise on what thermal printers are supported.',
        submission_date: '2026-06-18',
        submission_time: '11:15:30',
        created_at: '2026-06-18T11:15:30.000Z',
        ip_address: '103.241.12.94',
        status: 'New',
        status_history: JSON.stringify([
          { status: 'New', timestamp: '2026-06-18T11:15:30.000Z', note: 'Inquiry dispatched from Sector 62 Form' }
        ])
      },
      {
        id: 'BSP-2026-000002',
        full_name: 'Rajinder Sharma',
        email: 'rajinder@sharmasweets.in',
        phone: '+91 94120 44556',
        topic_category: 'Buying Query (Software Licenses)',
        message_description: 'Do you support integrating barcode weighing scales with your POS billing software? We have fresh sweet outlets and need weighing scales to directly print barcodes that your billing machine can scan.',
        submission_date: '2026-06-19',
        submission_time: '14:22:10',
        created_at: '2026-06-19T14:22:10.000Z',
        ip_address: '223.187.32.167',
        status: 'Read',
        status_history: JSON.stringify([
          { status: 'New', timestamp: '2026-06-19T14:22:10.000Z', note: 'Inquiry dispatched from Sector 62 Form' },
          { status: 'Read', timestamp: '2026-06-19T16:00:00.000Z', note: 'Status updated by Admin' }
        ])
      },
      {
        id: 'BSP-2026-000003',
        full_name: 'Dr. Meenakshi Iyer',
        email: 'iyer.meenakshi@gmail.com',
        phone: '+91 91223 88990',
        topic_category: 'Buying Query (Software Licenses)',
        message_description: 'We run a boutique resort and wellness spa in Rishikesh. Do you have a direct PMS or Hotel Management billing suite that handles check-in, check-out, spa billing, and restaurant POS together in one shared offline database?',
        submission_date: '2026-06-19',
        submission_time: '18:40:15',
        created_at: '2026-06-19T18:40:15.000Z',
        ip_address: '122.160.44.12',
        status: 'Replied',
        status_history: JSON.stringify([
          { status: 'New', timestamp: '2026-06-19T18:40:15.000Z', note: 'Inquiry dispatched from Sector 62 Form' },
          { status: 'Read', timestamp: '2026-06-20T09:30:00.000Z', note: 'Marked as read' },
          { status: 'Replied', timestamp: '2026-06-20T10:15:00.000Z', note: 'Replied with proposal email' }
        ])
      }
    ]
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
    businessAddress: 'Sector 62, Raipur POS Terminal Block B',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '201301',
    gstNumber: '09AAACS1234A1Z5',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Seed customer payment record
  db.payments.push({
    id: 'pay-seed-001',
    invoiceNumber: 'INV-2026-001',
    transactionId: 'pay_seed938475',
    paymentMethod: 'UPI',
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

// Callback hooks for IndexNow or other external notifications
export const dbHooks = {
  onVideoTutorialAddedOrUpdated: () => {},
  onDownloadAddedOrUpdated: () => {},
};

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
  
  getCategories: () => db.categories || [],
  getCategoryById: (id: string) => (db.categories || []).find(c => c.id === id),
  createCategory: (cat: SoftwareCategory) => {
    if (!db.categories) db.categories = [];
    db.categories.push(cat);
    saveDB();
    return cat;
  },
  updateCategory: (id: string, name: string) => {
    const idx = (db.categories || []).findIndex(c => c.id === id);
    if (idx > -1) {
      db.categories[idx].name = name;
      saveDB();
      return db.categories[idx];
    }
    return null;
  },
  deleteCategory: (id: string) => {
    db.categories = (db.categories || []).filter(c => c.id !== id);
    saveDB();
    return true;
  },
  saveCategoriesOrder: (orderedCats: SoftwareCategory[]) => {
    db.categories = orderedCats;
    saveDB();
    return db.categories;
  },
  createProduct: (product: Partial<Product> & { name: string }) => {
    const id = product.id || 'prod-' + Math.random().toString(36).substr(2, 9);
    const newProd: Product = {
      ...product,
      id,
      createdAt: new Date().toISOString()
    } as Product;
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
    const seqNum = String(db.orders.length + 1).padStart(6, '0');
    const id = `BSP-2026-${seqNum}`;
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
      const order = db.orders[idx];
      const previousStatus = order.status;
      const targetStatus = updates.status || previousStatus;

      // If transition is moving to a successful payment confirmed state
      const wasSucc = previousStatus === 'success' || previousStatus === 'Verified' || previousStatus === 'License Activated';
      const isNowSucc = targetStatus === 'success' || targetStatus === 'Verified' || targetStatus === 'License Activated';

      if (!wasSucc && isNowSucc && order.couponCode) {
        const couponCode = order.couponCode;
        const cp = db.coupons.find(c => (c.coupon_code && c.coupon_code.toUpperCase() === couponCode.toUpperCase()) || (c.code && c.code.toUpperCase() === couponCode.toUpperCase()));
        if (cp) {
          if (!db.couponRedemptions) db.couponRedemptions = [];
          const exists = db.couponRedemptions.some(r => r.order_id === order.id);
          if (!exists) {
            const discountAmt = Math.max(0, Math.round(order.amount)); // order.amount already has the discount factored
            const newRedemption: CouponRedemption = {
              id: 'cr-' + Math.random().toString(36).substr(2, 9),
              coupon_id: cp.id || cp.coupon_code || couponCode,
              user_id: order.userId,
              order_id: order.id,
              discount_amount: discountAmt,
              redeemed_at: new Date().toISOString()
            };
            db.couponRedemptions.push(newRedemption);
            cp.used_count = (cp.used_count || 0) + 1;
            console.log(`[COUPON REDEMPTION AUTOMATED] Coupon ${couponCode} consumed for verified payment of Order ${order.id}. New count: ${cp.used_count}`);
          }
        }
      }

      db.orders[idx] = { ...order, ...updates };
      saveDB();
      return db.orders[idx];
    }
    return null;
  },

  getLicenses: () => db.licenses,
  getLicensesByUser: (userId: string) => db.licenses.filter(l => l.userId === userId),
  createLicense: (userId: string, userEmail: string, orderId: string, productId: string, productName: string) => {
    const seqNum = String(db.licenses.length + 1).padStart(6, '0');
    const key = `BSP-LIC-2026-${seqNum}`;

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
    try {
      dbHooks.onDownloadAddedOrUpdated();
    } catch (e) {
      console.error('dbHooks onDownloadAddedOrUpdated error:', e);
    }
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
  getCouponByCode: (code: string) => {
    return db.coupons.find(c => {
      const matchNew = c.coupon_code && c.coupon_code.toUpperCase() === code.toUpperCase();
      const matchOld = c.code && c.code.toUpperCase() === code.toUpperCase();
      return matchNew || matchOld;
    });
  },
  createCoupon: (coupon: Coupon) => {
    const codeVal = (coupon.coupon_code || coupon.code || '').trim().toUpperCase();
    const fresh: Coupon = {
      ...coupon,
      id: coupon.id || 'cp-' + Math.random().toString(36).substr(2, 9),
      coupon_code: codeVal,
      created_at: coupon.created_at || new Date().toISOString(),
      used_count: coupon.used_count || 0,
      // Keep legacy support sync:
      code: codeVal,
      discountPercent: coupon.discount_type === 'percentage' ? Number(coupon.discount_value) : 10,
      active: coupon.status === 'active' || coupon.active === true,
      expiresBy: coupon.valid_to || '2027-12-31'
    };
    db.coupons.push(fresh);
    saveDB();
    return fresh;
  },
  updateCoupon: (id: string, couponData: Partial<Coupon>) => {
    const idx = db.coupons.findIndex(c => c.id === id || c.coupon_code === id || c.code === id);
    if (idx !== -1) {
      const existing = db.coupons[idx];
      const codeVal = (couponData.coupon_code || couponData.code || existing.coupon_code || existing.code || '').trim().toUpperCase();
      const updated = {
        ...existing,
        ...couponData,
        coupon_code: codeVal,
        // Make sure legacy values are synchronized
        code: codeVal,
        discountPercent: (couponData.discount_type || existing.discount_type) === 'percentage' 
          ? Number(couponData.discount_value || existing.discount_value) 
          : 10,
        active: (couponData.status || existing.status) === 'active' || couponData.active === true,
        expiresBy: couponData.valid_to || existing.valid_to || '2027-12-31'
      };
      db.coupons[idx] = updated;
      saveDB();
      return updated;
    }
    return null;
  },
  toggleCouponActive: (code: string) => {
    const cp = db.coupons.find(c => {
      const cId = c.id && c.id === code;
      const cCode = c.coupon_code && c.coupon_code.toUpperCase() === code.toUpperCase();
      const legacyCode = c.code && c.code.toUpperCase() === code.toUpperCase();
      return cId || cCode || legacyCode;
    });

    if (cp) {
      if (cp.status === 'active') {
        cp.status = 'disabled';
        cp.active = false;
      } else {
        cp.status = 'active';
        cp.active = true;
      }
      saveDB();
    }
    return cp;
  },
  deleteCoupon: (code: string) => {
    db.coupons = db.coupons.filter(c => {
      const isIdMatch = c.id && c.id === code;
      const isCodeMatch = c.coupon_code && c.coupon_code.toUpperCase() === code.toUpperCase();
      const isLegacyMatch = c.code && c.code.toUpperCase() === code.toUpperCase();
      return !(isIdMatch || isCodeMatch || isLegacyMatch);
    });
    saveDB();
  },
  getCouponRedemptions: () => db.couponRedemptions || [],
  createCouponRedemption: (red: Omit<CouponRedemption, 'id' | 'redeemed_at'>) => {
    if (!db.couponRedemptions) {
      db.couponRedemptions = [];
    }
    const fresh: CouponRedemption = {
      ...red,
      id: 'cr-' + Math.random().toString(36).substr(2, 9),
      redeemed_at: new Date().toISOString()
    };
    db.couponRedemptions.push(fresh);
    
    // Increment used_count on the associated coupon
    const cp = db.coupons.find(c => c.id === red.coupon_id || c.coupon_code === red.coupon_id);
    if (cp) {
      cp.used_count = (cp.used_count || 0) + 1;
    }
    
    saveDB();
    return fresh;
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
  updateBlog: (id: string, blogData: Partial<Blog>) => {
    const idx = db.blogs.findIndex(b => b.id === id);
    if (idx !== -1) {
      db.blogs[idx] = { ...db.blogs[idx], ...blogData };
      saveDB();
      return db.blogs[idx];
    }
    return null;
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
    try {
      dbHooks.onVideoTutorialAddedOrUpdated();
    } catch (e) {
      console.error('dbHooks onVideoTutorialAddedOrUpdated error:', e);
    }
    return newVid;
  },
  updateVideoTutorial: (id: string, updates: Partial<VideoTutorial>) => {
    if (!db.videos) db.videos = [];
    const idx = db.videos.findIndex(v => v.id === id);
    if (idx > -1) {
      db.videos[idx] = { ...db.videos[idx], ...updates };
      saveDB();
      try {
        dbHooks.onVideoTutorialAddedOrUpdated();
      } catch (e) {
        console.error('dbHooks onVideoTutorialAddedOrUpdated error:', e);
      }
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
  createSolution: (sol: any) => {
    const id = sol.id || 'sol-' + Math.random().toString(36).substring(2, 11);
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
  },
  bulkDeleteSolutions: (ids: string[]) => {
    if (!db.solutions) db.solutions = [];
    db.solutions = db.solutions.filter(s => !ids.includes(s.id));
    saveDB();
    return true;
  },
  
  getContactMessages: () => db.contactMessages || [],
  createContactMessage: (msg: any) => {
    if (!db.contactMessages) db.contactMessages = [];
    // Ensure uniqueness
    const exists = db.contactMessages.some(m => m.id === msg.id);
    if (!exists) {
      db.contactMessages.unshift(msg);
      saveDB();
    }
    return msg;
  },
  updateContactMessage: (id: string, updates: any) => {
    if (!db.contactMessages) db.contactMessages = [];
    const idx = db.contactMessages.findIndex(m => m.id === id);
    if (idx !== -1) {
      db.contactMessages[idx] = { ...db.contactMessages[idx], ...updates };
      saveDB();
      return db.contactMessages[idx];
    }
    return null;
  },
  deleteContactMessage: (id: string) => {
    if (!db.contactMessages) db.contactMessages = [];
    db.contactMessages = db.contactMessages.filter(m => m.id !== id);
    saveDB();
    return true;
  },
  bulkDeleteContactMessages: (ids: string[]) => {
    if (!db.contactMessages) db.contactMessages = [];
    const idSet = new Set(ids);
    db.contactMessages = db.contactMessages.filter(m => !idSet.has(m.id));
    saveDB();
    return true;
  }
};

// Auto-run DB init on import
initDB();
