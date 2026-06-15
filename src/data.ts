export const defaultProducts = [
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

export const defaultTestimonials = [
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

export const defaultDownloads = [
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

export const defaultVideos = [
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

export const defaultSolutions = [
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
