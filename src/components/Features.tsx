/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Printer, 
  Barcode, 
  Lock, 
  Users, 
  FileCheck, 
  TrendingUp, 
  Scale, 
  Sparkles, 
  Database, 
  Settings, 
  DollarSign,
  Monitor,
  HardDrive,
  Clock,
  ArrowRight
} from 'lucide-react';

interface FeaturesProps {
  onPageChange: (page: string) => void;
}

export default function Features({ onPageChange }: FeaturesProps) {
  const [activeTab, setActiveTab] = useState<'billing' | 'inventory' | 'gst' | 'reports'>('billing');

  const detailedFeatures = {
    billing: {
      title: 'POS Dynamic Retail Billing Engine',
      subtitle: 'Perform high-speed retail checkout, print tickets, and save balances offline.',
      points: [
        'Multi-keyboard shortcuts matching traditional legacy offline terminal styles.',
        'Accept combined multiple payments modes: Cash, Cards, UPI barcode, and Khata (credit accounts).',
        'Direct connection to any standard 58mm/80mm physical thermal checkout printer.',
        'Design beautiful print headers containing state GST codes, terms, and custom merchant brand logos.',
        'Instant customer search by mobile digits to automatically track credit balances (Udhar ledger).'
      ],
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800'
    },
    inventory: {
      title: 'Automated Real-Time Stock Management',
      subtitle: 'Keep accurate tracking of batches, stock variations, barcodes and expiration alerts.',
      points: [
        'Define low-stock thresholds per item to prompt automatic ordering sheets.',
        'Upload bulk products catalogs via standard Excel sheets in seconds.',
        'Generate dynamic barcode labels from item serial codes instantly.',
        'Batch tracking suited for pharmacies - monitor drug compositions and expiry alerts.',
        'Complete supplier ledger account tracking: purchases, return histories, and bills.'
      ],
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'
    },
    gst: {
      title: 'Super Simplified GST & Taxation Reports',
      subtitle: 'Complete compliance with GSTR returns, inter-state schemas and precise calculations.',
      points: [
        'Calculates exact SGST, CGST, IGST splits per billing invoice automatically based on state regions.',
        'Configures custom HSN codes, discount schemes, tax rates (0%, 5%, 12%, 18%, 28%) effortlessly.',
        'Export standard multi-column GST sales reports in absolute compliance with CA standards.',
        'One-click JSON file exports ready for immediate upload to the Indian GST Portal.',
        'Support for Composition scheme billing as well as Regular scheme invoices.'
      ],
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800'
    },
    reports: {
      title: 'Advanced Sale Analytics & Profit/Loss',
      subtitle: 'Trace complete business performance with comprehensive financial spreadsheets.',
      points: [
        'Detailed sales ledger reports grouped by days, brands, categories or individual staff accounts.',
        'True Net Profit analysis matching item-wise purchase rates to sale prices.',
        'Detailed daily cash books tracking store cash inputs and miscellaneous store expenses.',
        'Direct single-click exports of all charts and summary tables into clear Microsoft Excel templates.'
      ],
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800'
    }
  };

  const featureGrid = [
    { icon: <Printer className="text-blue-500 w-5 h-5" />, title: 'Thermal POS Spooling', desc: 'Direct raw ESC/POS commands formatting ensures instant printing without waiting for print dialogue pages.' },
    { icon: <Barcode className="text-emerald-500 w-5 h-5" />, title: 'Barcode Generation', desc: 'Auto-generates clean barcode formats (EAN-13, Code 128) using your stock numbers, printable on standard sticky sheets.' },
    { icon: <Database className="text-violet-500 w-5 h-5" />, title: 'Offline Local SQL', desc: 'Runs fully local with immediate read/writes. Your records won’t slow down or stop even if your local network drops.' },
    { icon: <Users className="text-amber-500 w-5 h-5" />, title: 'Smart Khata Ledger', desc: 'Provides dynamic SMS or click link configurations to ping customer ledger balances securely over Whatsapp.' },
    { icon: <DollarSign className="text-indigo-500 w-5 h-5" />, title: 'Expense Auditer', desc: 'Log miscellaneous shop expenses (electricity, rent, tea, freight costs) to calculate accurate true net store savings.' },
    { icon: <Settings className="text-rose-500 w-5 h-5" />, title: 'Auto Database Backups', desc: 'Ensures database security by backing up a duplicated encrypted file to alternative local hard disks or Google Drive folders daily.' }
  ];

  return (
    <div className="py-16 space-y-20 pb-24">
      {/* HEADER SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">Product Capabilities</h1>
        <p className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none">
          Designed for Zero Lag and 100% Tax Accuracy
        </p>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          BSP Suryatech is custom-made to eliminate complex accounting jargon and deliver raw billing performance. Ideal for retail stores, supermarkets, pharmacies, and hardware distributors.
        </p>
      </section>

      {/* CORE CAPABILITY TABBED SWITCHER */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 border-b border-slate-100 pb-6 mb-12">
            {(['billing', 'inventory', 'gst', 'reports'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all uppercase cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                id={`tab-btn-${tab}`}
              >
                {tab === 'billing' && 'Billing Engine'}
                {tab === 'inventory' && 'Inventory Management'}
                {tab === 'gst' && 'GST Returns'}
                {tab === 'reports' && 'Sale Analytics'}
              </button>
            ))}
          </div>

          {/* Active Tab View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content list */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 leading-tight">
                {detailedFeatures[activeTab].title}
              </h2>
              <p className="text-slate-500 text-base font-medium">
                {detailedFeatures[activeTab].subtitle}
              </p>
              
              <ul className="space-y-4 pt-2">
                {detailedFeatures[activeTab].points.map((pt, i) => (
                  <li key={i} className="flex gap-3 items-start" id={`tab-point-${activeTab}-${i}`}>
                    <div className="p-0.5 bg-blue-50 border border-blue-100 rounded text-blue-600 mt-1 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">{pt}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <button
                  onClick={() => onPageChange('downloads')}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl tracking-wide shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Evaluate Feature inside Offline Trial</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Right mockup image representation */}
            <div className="lg:col-span-5 relative" id="tab-mockup-frame">
              <div className="absolute inset-0 bg-blue-600/10 rounded-2xl blur-2xl" />
              <img 
                src={detailedFeatures[activeTab].image} 
                alt={detailedFeatures[activeTab].title} 
                className="relative rounded-2xl shadow-xl w-full object-cover aspect-4/3 border-4 border-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ADDITIONAL SMALL CARD UTILITY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#10B981]">Deep Engineering</h2>
          <p className="text-3xl font-extrabold tracking-tight text-slate-900">
            Every Detail Programmed for High Usability
          </p>
          <p className="text-slate-500 text-sm">
            We spend thousands of hours speaking with brick-and-mortar store operators to streamline layout flows and prevent database corrupted records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureGrid.map((fg, idx) => (
            <div key={idx} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 mb-2">
                  {fg.icon}
                </div>
                <h4 className="font-extrabold text-slate-800 text-base leading-snug">{fg.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{fg.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECONDARY CALL TO ACTION SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 text-center space-y-6">
          <h3 className="text-2xl sm:text-3xl font-black">Ready to eliminate your billing headaches?</h3>
          <p className="text-slate-450 text-sm max-w-xl mx-auto">
            Install BSP Suryatech on your local windows terminal machine today. One-minute setup, 100% offline, absolute billing peace of mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              onClick={() => onPageChange('downloads')}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 font-extrabold rounded-xl shadow-lg transition-colors cursor-pointer text-sm"
            >
              Download setup.exe payload
            </button>
            <button
              onClick={() => onPageChange('pricing')}
              className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 font-extrabold border border-slate-700 rounded-xl transition-colors cursor-pointer text-sm"
            >
              Buy Lifetime Key (₹3000)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
