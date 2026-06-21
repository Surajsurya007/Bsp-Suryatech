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
    id: 'sol-restaurant',
    mappedPlanId: 'prod-billing-pro',
    title: 'Restaurant POS & KOT Software',
    category: 'Billing Software',
    subtitle: 'KITCHEN & HOTEL SPECIAL',
    description: 'Streamlined table menus ordering, instantaneous kitchen order tickets dispatching, split bills, and table mappings.',
    price: '₹3,000',
    features: [
      'Kitchen Order Tickets (KOT)',
      'Table Mapping & Status',
      'Split Billing & Discounts',
      'Captains App Integration',
      'Multi-payment checkout'
    ],
    icon: '🍽️',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Restaurant-v1.0.0-Setup.zip'
  },
  {
    id: 'sol-mobile',
    mappedPlanId: 'prod-billing-pro',
    title: 'Mobile Shop Billing Software',
    category: 'Billing Software',
    subtitle: 'IMEI & SERIAL TRACKER',
    description: 'Perfect for smartphone and electronics repair centers. Dynamic tracking of unique IMEI and serial tags.',
    price: '₹3,000',
    features: [
      'Unique IMEI/Serial logging',
      'Dynamic Repairs Tracker',
      'Accessories Inventory Control',
      'Supplier Serial Sync',
      'Technician assignments'
    ],
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
    price: '₹3,000',
    features: [
      'Dual-Serial Code validation',
      'Manufacturer Warranty link',
      'Installations tracking',
      'Multi-warehouse logistics',
      'Finance/EMI Checkout options'
    ],
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
    price: '₹3,000',
    features: [
      'Fleet Management',
      'Vehicle Tracking',
      'Driver Management',
      'Route Planning',
      'Trip Management'
    ],
    icon: '🚚',
    badge: 'Transport',
    badgeColor: 'blue',
    exeUrl: ''
  },
  {
    id: 'sol-hospital',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'Hospital Management Software',
    category: 'Hospital Software',
    subtitle: 'COMPLETE CLINICAL SUITE',
    description: 'Enterprise-grade platform for managing multi-specialty clinical operations, patient registrations, IPD/OPD, and doctors slots.',
    price: '₹3,000',
    features: [
      'Patient Registration',
      'OPD Management',
      'IPD Management',
      'Doctor Management',
      'Appointment Scheduling'
    ],
    icon: '🏥',
    badge: 'Hospital',
    badgeColor: 'red',
    exeUrl: ''
  },
  {
    id: 'sol-school',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'School Management Software',
    category: 'School Software',
    subtitle: 'CAMPUS ERP SUITE',
    description: 'Consolidated school and college operations, managing admissions database, fee schedules collection, exams, and attendance.',
    price: '₹3,000',
    features: [
      'Student Management',
      'Admission Management',
      'Attendance Management',
      'Fee Collection',
      'Exam Management'
    ],
    icon: '🏫',
    badge: 'School',
    badgeColor: 'indigo',
    exeUrl: ''
  },
  {
    id: 'sol-inventory',
    mappedPlanId: 'prod-billing-pro',
    title: 'Inventory Management Software',
    category: 'Billing Software',
    subtitle: 'STOCK CONTROL PRO',
    description: 'Dedicated supply chain tracker with SKU code generation, multi-bin inventory controls, and automatic purchase orders.',
    price: '₹3,000',
    features: [
      'Multi-warehouse SKU grids',
      'Barcode layouts printing',
      'Supplier Ledger balances',
      'Automated Purchase PO',
      'Dead Stock audit logs'
    ],
    icon: '📦',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: ''
  },
  {
    id: 'sol-erp-warehouse',
    mappedPlanId: 'prod-billing-enterprise',
    title: 'ERP Management Software',
    category: 'ERP Software',
    subtitle: 'ENTERPRISE RESOURCE ERP',
    description: 'Unified system combining production, accounts, sales forces CRM, human resource profiles, and payroll audits.',
    price: '₹1',
    features: [
      'Sales Management',
      'Purchase Management',
      'Inventory Management',
      'Accounts Management',
      'CRM'
    ],
    icon: '⚙️',
    badge: 'ERP',
    badgeColor: 'purple',
    exeUrl: ''
  }
];
