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
