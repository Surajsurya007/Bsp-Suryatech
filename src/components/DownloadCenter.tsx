/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Download, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  Monitor, 
  HardDrive, 
  Clock, 
  Settings, 
  ShieldAlert, 
  Cpu, 
  FileText,
  Bookmark,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Zap
} from 'lucide-react';

interface DownloadCenterProps {
  downloads: any[];
  totalDownloads: number;
  onTriggerTrialDownload: (prodId: string, isFull?: boolean) => void;
  onPageChange?: (page: string) => void;
  onAddToCart?: (planId: string) => void;
  solutions?: SoftwareSolution[];
}

interface SoftwareSolution {
  id: string;
  mappedPlanId: string;
  title: string;
  category: string;
  subtitle: string;
  description: string;
  price: string;
  originalPrice?: string;
  version?: string;
  size?: string;
  bannerUrl?: string;
  banner_url?: string;
  logo_url?: string;
  trialUrl?: string;
  trial_download_url?: string;
  setup_exe_url?: string;
  buy_now_link?: string;
  learn_more_link?: string;
  features: string[];
  icon: string;
  badge: string;
  badgeColor: string;
  exeUrl?: string;
  status?: 'active' | 'inactive';
  displayOrder?: number;
}

const categories = [
  'All Solutions',
  'Billing Software',
  'Transport Software',
  'Hospital Software',
  'School Software',
  'ERP Software'
];

const solutions: SoftwareSolution[] = [
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
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Medical-Store-ERP-v3.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-Restaurant-POS-KOT-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Mobile-Shop-Billing-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Electronics-Shop-Billing-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/SafeWheels-ERP-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Hospital-Management-ERP-v3.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Laboratory-Management-ERP-v3.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/School-Management-ERP-v3.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Inventory-Management-ERP-v3.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Hotel-Management-ERP-v3.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/BSP-SuryaTech-Flow-ERP-v1.0.0.zip'
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
    exeUrl: 'https://bspsuryatech.in/downloads/Resort-Spa-PMS-v3.0.0.zip'
  }
];

export const getCleanDownloadFileName = (url?: string): string => {
  if (!url) return 'Setup.zip';
  const parts = url.split('/');
  let filename = parts[parts.length - 1];
  
  filename = filename
    .replace(/\.Setup\.exe\.zip$/i, '.zip')
    .replace(/\.Setup\.zip$/i, '.zip')
    .replace(/\.Setup\.exe$/i, '.zip')
    .replace(/\.exe\.zip$/i, '.zip')
    .replace(/\.exe$/i, '.zip');
    
  if (!filename.toLowerCase().endsWith('.zip')) {
    filename = filename + '.zip';
  }
  return filename;
};

export default function DownloadCenter({ downloads, totalDownloads, onTriggerTrialDownload, onPageChange, onAddToCart, solutions: propSolutions = [] }: DownloadCenterProps) {
  const [downloadFilter, setDownloadFilter] = useState<'all' | 'stable' | 'manuals'>('all');
  const [selectedSolutionCategory, setSelectedSolutionCategory] = useState<string>('All Solutions');

  const activeSolutions = propSolutions && propSolutions.length > 0 ? propSolutions : solutions;
  const visibleSolutions = activeSolutions.filter((sol) => sol.status !== 'inactive');
  const sortedSolutions = [...visibleSolutions].sort((a, b) => {
    const orderA = a.displayOrder !== undefined ? a.displayOrder : 1000;
    const orderB = b.displayOrder !== undefined ? b.displayOrder : 1000;
    return orderA - orderB;
  });
  
  const activeCategories = [
    'All Solutions',
    ...Array.from(new Set(sortedSolutions.map((sol) => sol.category))).filter((cat): cat is string => !!cat)
  ];

  const systemRequirements = [
    { title: 'Operating State System', val: 'Windows 7 SP1, Windows 8, Windows 10, or Windows 11 (32-bit & 64-bit)' },
    { title: 'Local CPU Processer', val: 'Intel Core i3 or AMD equivalent processor (1.8Ghz minimum)' },
    { title: 'System memory Memory', val: '2 GB RAM minimum (4 GB recommended for large batch stocks)' },
    { title: 'Hard Drive Space', val: '100 MB free local disk space for setup installation files' },
    { title: 'Accounting Database', val: 'Microsoft Access or SQLite local files (Fully self-contained, auto-configured)' }
  ];

  return (
    <div className="py-16 space-y-20 pb-24">
      {/* HEADER WITH DOWNLOAD COUNTER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-[#10B981]">Download Center</h1>
        <p className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
          Get BSP Suryatech Desktop Clients
        </p>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          Download the raw installer payloads for Windows. Install standard free trial editions, review precise release changelogs, or access offline setup guides and user guides.
        </p>
        
        {/* Dynamic global system download count badge */}
        <div className="pt-2 inline-flex" id="global-download-counter-badge">
          <div className="bg-slate-900 px-5 py-2.5 rounded-full border border-slate-800 flex items-center gap-3 shadow text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-slate-350">
              Total Safe Software Downloads: <strong className="text-white font-extrabold text-sm">{totalDownloads}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* SOFTWARE PACKAGES AND SOLUTIONS ACTIONS CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-extrabold text-slate-900 text-3xl tracking-tight">Select Your Business Solution</h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto">
            Explore industry-specific offline-first desktop systems. Select a layout filter category to instantly view and purchase tailored packages.
          </p>

          {/* Dynamic Tabs Pills with active state */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            {activeCategories.map((cat) => {
              const isActive = selectedSolutionCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedSolutionCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-bold leading-normal transition-all duration-200 cursor-pointer border ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-103'
                      : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  id={`cat-tab-button-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 select-none" id="solutions-interactive-grid">
          {sortedSolutions
            .filter((sol) => selectedSolutionCategory === 'All Solutions' || sol.category === selectedSolutionCategory)
            .map((sol) => (
              <div 
                key={sol.id} 
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden border border-slate-100 hover:border-slate-250 group/card transform hover:-translate-y-1"
                id={`sol-card-${sol.id}`}
              >
                {/* Desktop App frame container header */}
                <div className="bg-[#090D1A] px-4 py-3 flex items-center justify-between border-b border-b-slate-800/60 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block opacity-90 animate-pulse" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block opacity-90" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block opacity-90" />
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-500 font-bold tracking-widest uppercase">
                    DESKTOP_WIN_V3.0
                  </div>
                </div>

                {/* Dark Blue patterned graphic icon header */}
                <div 
                  className="bg-slate-950 px-6 pt-[15px] pb-12 flex flex-col items-center justify-center relative overflow-hidden select-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle at top, #0E1B32 0%, #040810 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 2px, transparent 2px, transparent 10px)'
                  }}
                >
                  {/* Glowing light effect behind icon */}
                  <div className="absolute inset-0 bg-blue-500/5 filter blur-2xl rounded-full scale-75" />
                  
                  {/* Huge software asset placeholder icon as emoji or logo */}
                  {sol.logo_url ? (
                    <img 
                      src={sol.logo_url} 
                      alt={sol.title} 
                      className="w-16 h-16 object-contain relative z-10 transform group-hover/card:scale-110 transition-transform duration-300" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }} 
                    />
                  ) : (
                    <span className="text-5xl drop-shadow-md transform group-hover/card:scale-110 transition-transform duration-300 relative z-10">
                      {sol.icon || '🛍️'}
                    </span>
                  )}

                  {/* Specific themed category badge under the icon */}
                  {(() => {
                    const cat = (sol.category || '').toLowerCase();
                    const b = (sol.badge || '').toLowerCase();
                    let badgeLabel = 'Billing';
                    let badgeClass = 'bg-[#DCFCE7] text-[#15803D] border-emerald-200';

                    if (cat.includes('billing') || b === 'billing') {
                      badgeLabel = 'Billing';
                      badgeClass = 'bg-[#DCFCE7] text-[#15803D] border-emerald-200';
                    } else if (cat.includes('transport') || b === 'transport' || cat.includes('logistic')) {
                      badgeLabel = 'Transport';
                      badgeClass = 'bg-[#E0F2FE] text-[#0369A1] border-sky-200';
                    } else if (cat.includes('hospital') || b === 'hospital' || cat.includes('clinic')) {
                      badgeLabel = 'Hospital';
                      badgeClass = 'bg-[#FEE2E2] text-[#B91C1C] border-rose-200';
                    } else if (cat.includes('school') || b === 'school' || cat.includes('campus') || cat.includes('college')) {
                      badgeLabel = 'School';
                      badgeClass = 'bg-[#EEF2FF] text-[#4338CA] border-indigo-200';
                    } else if (cat.includes('erp') || b === 'erp' || cat.includes('enterprise')) {
                      badgeLabel = 'ERP';
                      badgeClass = 'bg-[#FEF3C7] text-[#B45309] border-amber-200';
                    } else {
                      badgeLabel = sol.badge || 'Billing';
                      badgeClass = sol.badge === 'Billing' ? 'bg-[#DCFCE7] text-[#15803D] border-emerald-200' : 'bg-[#FEF3C7] text-[#B45309] border-amber-200';
                    }

                    return (
                      <span className={`px-3.5 py-1 text-[11px] font-bold rounded-full tracking-wide border absolute bottom-4 shadow-sm z-10 ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    );
                  })()}
                </div>

                {/* Information contents block */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Bestseller/Special subtag */}
                    <span className="text-[10px] font-black text-blue-600 font-sans tracking-wide uppercase bg-blue-50 px-2.5 py-1 rounded">
                      {sol.subtitle || 'BUSINESS SOLUTION'}
                    </span>

                    <h3 className="text-lg font-bold text-slate-900 leading-tight mt-2.5 tracking-tight group-hover/card:text-blue-600 transition-colors">
                      {sol.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed font-normal min-h-[40px]">
                      {sol.description}
                    </p>

                    {/* Features checklist */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">KEY FEATURES:</span>
                      <ul className="space-y-2">
                        {sol.features.map((feat, fidx) => (
                           <li key={fidx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                            <span className="text-[#10B981] font-bold text-sm shrink-0">✓</span>
                            <span className="truncate">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing and purchase buttons block */}
                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold font-mono tracking-tight uppercase">Lifetime License</span>
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900 tracking-tight font-sans">
                          {sol.price}
                        </span>
                      </div>
                    </div>

                    {/* Direct download button requested by customer */}
                    <a
                      href={sol.exeUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={getCleanDownloadFileName(sol.exeUrl)}
                      onClick={() => {
                        console.log(`DownloadCenter: Downloading setup file directly: ${sol.exeUrl}`);
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 mt-4 transition-all duration-155 cursor-pointer shadow-md hover:shadow-emerald-500/10 active:scale-97 text-center decoration-none inline-flex"
                      id={`sol-download-link-${sol.id}`}
                    >
                      <Download className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Download Setup</span>
                    </a>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        onClick={() => {
                          console.log(`DownloadCenter: Adding ${sol.title} Solution (${sol.id}) to cart...`);
                          onAddToCart?.(sol.id);
                        }}
                        className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer text-center shadow-sm"
                      >
                        <Zap className="w-3 h-3 fill-current text-white shrink-0" />
                        <span>Buy Now</span>
                      </button>
                      <button
                        onClick={() => {
                          onPageChange?.(`software-details:${sol.id}`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="py-3 bg-white border border-slate-250 hover:bg-slate-50 text-slate-800 hover:text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center transition-all duration-150 cursor-pointer text-center shadow-sm"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>

              </div>
          ))}
        </div>
      </section>



      {/* SYSTEM HARDWARE REQUIREMENTS TABLE */}
      <section className="bg-slate-100 border-y border-slate-200/60 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rounded-3xl">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-3.5 mb-8">
            <h3 className="font-extrabold text-slate-900 text-2xl">Terminal System Configuration</h3>
            <p className="text-xs text-slate-500">BSP Suryatech uses a highly streamlined codebase with incredibly small memory overhead. Run full-speed POS on any basic Windows terminal.</p>
          </div>

          <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
            {systemRequirements.map((req, rIdx) => (
              <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-12 p-4 text-xs sm:text-sm" id={`requirement-row-${rIdx}`}>
                <div className="sm:col-span-4 font-extrabold text-slate-800 tracking-tight">{req.title}</div>
                <div className="sm:col-span-8 text-slate-600 mt-1 sm:mt-0 font-medium leading-relaxed">{req.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCUMENTATION MANUAL DOWNLOADS */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6" id="pdf-manuals-section">
          <div className="flex gap-4 items-start text-center sm:text-left flex-col sm:flex-row">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl mx-auto shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 text-base">Download Complete PDF Installation User Manual</h4>
              <p className="text-xs text-slate-500 leading-normal max-w-md">Contains detailed step-by-step instructions with custom screenshot examples to assist setting up barcode sizes, thermal layouts, and Excel catalogue imports.</p>
            </div>
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              console.log("DownloadCenter: Generating installation user manual PDF client-side...");
              const textContent = `BSP Suryatech Retail Billing & GST Enterprise Software
------------------------------------------------------------
COMPLETE WINDOWS INSTALLATION & USER GUIDE (v4.2.1 - v5.0.3)

1. SYSTEM REQUIREMENTS:
   - Operating System: Windows 7, 8, 10, 11 (32-bit or 64-bit)
   - .NET Framework v4.7.2 or higher
   - Min Resolution: 1024x768 (Optimal: 1366x768 POS layout)
   - Printer Compatability: Any 2-inch or 3-inch USB, thermal printer (58mm / 80mm)

2. INSTALLATION PROCEDURES:
   - Double-click the BSPSuryatech_Setup.exe installation payload.
   - Authorize Windows Administrator dialog permission controls.
   - Follow prompt instructions and click Complete Install.
   - Double-click desktop shortcut launch icon.

3. SETTING UP COMPACT WORKSPACE:
   - Complete client info settings on startup.
   - Enter your unique 24-digit activated serial security key.
   - Use Excel sheet loaders to import bulk inventory products lists.
   - Go to print layout customizer designer to add custom retail headers or GST numbers.

4. USER ACTIONS & BILLING:
   - Use Barcode scanner or press F2 to lookup product lists indices.
   - Enter customer names and contact phones to accumulate loyalty.
   - Press Enter to automatically print the receipt and save logs in database.
   
Need Support? Call Suryatech helpline details: +91 95169 16415
Email contacts: Support@bspsuryatech.in
Corporate Address: Sector 62, Raipur, Chhattisgarh, India.`;
              const blob = new Blob([textContent], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'BSPSuryatech_UserManual_v4.2.1.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            className="px-6 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase rounded-xl tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF (4.8 MB)</span>
          </a>
        </div>
      </section>

    </div>
  );
}
