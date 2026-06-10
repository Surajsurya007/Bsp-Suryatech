/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Phone,
  CheckCircle2, 
  Download, 
  Star, 
  TrendingUp, 
  Smartphone, 
  Printer, 
  FileSpreadsheet, 
  Barcode, 
  ShieldCheck, 
  Users, 
  ChevronDown,
  Coins,
  Cpu,
  BadgeAlert,
  Database,
  Briefcase,
  Store,
  MessageSquare,
  Gift,
  AlertCircle
} from 'lucide-react';

interface HomeProps {
  onPageChange: (page: string) => void;
  products: any[];
  onTriggerTrialDownload: (prodId: string) => void;
  testimonials: any[];
}

export default function Home({ onPageChange, products, onTriggerTrialDownload, testimonials }: HomeProps) {
  // Accordion active state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const mainFeatures = [
    {
      icon: <Printer className="w-6 h-6 text-blue-600" />,
      title: 'POS Billing & Thermal Print',
      desc: 'Print receipts on standard 58mm & 80mm thermal printers. Ultra-fast layout generation engine guarantees no check-out queues.',
    },
    {
      icon: <Barcode className="w-6 h-6 text-emerald-600" />,
      title: 'E-Way & GST Dynamic Invoices',
      desc: 'Automatic CGST, SGST, IGST calculations. One-click JSON export directly uploadable to the Government GST filing portal.',
    },
    {
      icon: <Database className="w-6 h-6 text-indigo-600" />,
      title: 'Advanced Stock & Expiry Tracking',
      desc: 'Manage inventory with low-stock custom triggers, automatic expiry alerts, and integrated barcode scanner integrations.',
    },
    {
      icon: <Users className="w-6 h-6 text-amber-600" />,
      title: 'Customer & Supplier Ledgers',
      desc: 'Track pending credits (Khata / Udhar account books). Send direct WhatsApp balance reminders to customers with click links.',
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-violet-600" />,
      title: 'Tally Expense & Accounting',
      desc: 'Generate comprehensive Profit/Loss sheets, tax reports, day-books, and product category sale summaries in Excel.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
      title: 'Security & Auto Local Backup',
      desc: '100% offline desktop-first solution. Your critical cash data never leaves your computer, with scheduled cloud backups.',
    },
  ];

  const industries = [
    { title: 'Kirana & Grocery', icon: <Store className="w-5 h-5 text-blue-600" />, desc: 'Bulk barcodes scanning, weight integration, and quick receipt keys.' },
    { title: 'Pharmacies & Chemists', icon: <Cpu className="w-5 h-5 text-emerald-600" />, desc: 'Track batch numbers, medical drug compositions, and shelf labels.' },
    { title: 'Electronics & Mobiles', icon: <TrendingUp className="w-5 h-5 text-indigo-600" />, desc: 'Manage IMEI numbers, serial tracking, and warranty receipts.' },
    { title: 'Clothing & Apparel', icon: <Briefcase className="w-5 h-5 text-amber-600" />, desc: 'Multiple size definitions, color patterns, and discount tags.' },
    { title: 'FMCG Distributors', icon: <Coins className="w-5 h-5 text-violet-600" />, desc: 'Wholesale trade discounts, invoice grouping, and multi-van dispatch.' },
    { title: 'Restaurants & Cafes', icon: <Printer className="w-5 h-5 text-rose-600" />, desc: 'Table-wise KOT orders, kitchen printers, and quick split-bills.' },
  ];

  const faqs = [
    {
      q: 'Does BSP Suryatech software require active internet to function?',
      a: 'No, BSP Suryatech is a desktop Windows application that operates 100% offline. All store details, stock ledgers, and transactions are securely saved locally on your physical computer. Internet connection is only required for the initial license activation and optional cloud back-ups.'
    },
    {
      q: 'Is this software fully compliant with the Indian GST return standards?',
      a: 'Yes, absolutely. The software fully complies with the latest GST rules. It automatically splits CGST, SGST, and IGST according to inter-state/intra-state laws, registers HSN codes, and exports standard offline JSON schemas that can be directly uploaded to the gst.gov.in portal.'
    },
    {
      q: 'What is a "Lifetime License" and are there any yearly renew charges?',
      a: 'A Lifetime License (available for only ₹1999 on our retail billing plan) means you make a one-time purchase. You receive a persistent serial registration key with no annual activation fees, no subscription requirements, and free offline update downloads forever.'
    },
    {
      q: 'What local printers are supported by the billing platform?',
      a: 'We support all standard thermal POS receipt printers (58mm and 80mm) via standard Windows print spoolers (such as Epson, TVS, SEWOO, RONGTA). It also supports normal Laser/Inkjet printers for traditional full-page A4 and A5 bill print designs.'
    },
    {
      q: 'How do I activate the customer serial key after purchasing the software?',
      a: 'Once you make a successful UPI or card payment online through our payment gateway, your serial code key is instantly visible in your Customer Portal. Simply download the EXE installer, open the registration wizard modal in the software, input your email and license key, and the program will unlock instantly.'
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION WITH DECORATIVE ACCENTS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        {/* Ambient colored glowing circles */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/5 right-1/10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1E293B] border border-slate-850 rounded-sm text-blue-400 text-xs font-semibold tracking-wider uppercase">
                <Gift className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Special Monsoon Offer – Save 60% Today</span>
              </div>
              <span className="text-[#10B981] font-mono text-xs sm:text-sm tracking-[0.2em] uppercase block font-bold">// Lightning-Fast Desktop Billing</span>
              <h1 className="text-4xl sm:text-6xl lg:text-8xl leading-[0.85] font-black uppercase tracking-tighter text-white max-w-2xl mx-auto lg:mx-0">
                Master Your <br /><span className="text-[#2563EB]">GST Billing.</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Empower your retail store, supermarket, pharmacy or warehouse with India’s ultimate offline POS billing software. Print thermal invoices instantly, trace inventory, and export GST returns in one click.
              </p>
              
              {/* Trust badges list */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-3 gap-x-6 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5 font-medium font-mono uppercase tracking-wider text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>100% Offline (No Internet Req.)</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium font-mono uppercase tracking-wider text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>GSTIN Compliant Schemes</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium font-mono uppercase tracking-wider text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>One-time Purchase</span>
                </div>
              </div>

              {/* CTAs buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onPageChange('downloads')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] text-white font-bold text-xs uppercase tracking-widest rounded-sm flex items-center justify-center gap-3 shadow-[6px_6px_0px_#1e3a8a] transition-all hover:bg-blue-600 hover:translate-x-0.5 hover:translate-y-0.5 active:scale-98 cursor-pointer"
                  id="hero-download-trial-btn"
                >
                  <Download className="w-4 h-4" />
                  Download Free Trial EXE
                </button>
                <button
                  onClick={() => onPageChange('pricing')}
                  className="w-full sm:w-auto px-8 py-4 border border-slate-705 hover:border-white transition-colors text-white font-bold text-xs uppercase tracking-widest rounded-sm cursor-pointer"
                  id="hero-pricing-btn"
                >
                  <span>View Licensing Plans</span>
                </button>
              </div>

              {/* Dynamic counters strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0 border-t border-slate-800">
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-extrabold text-blue-400">14,200+</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Outlets</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-extrabold text-emerald-400">1.8M+</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bills Printed</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-extrabold text-amber-500">4.9/5 ★</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Customer Rating</div>
                </div>
              </div>
            </div>
                        {/* Right Column: Dynamic Visual Mockup Board representing physical terminal */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0" id="hero-graphic-isometric">
              <div className="relative bg-[#1E293B] border border-slate-700 rounded-sm shadow-2xl p-4 overflow-hidden">
                {/* Simulated App Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="text-[10px] font-mono text-slate-400 font-semibold ml-2">BSP Suryatech Retail v4.2.1</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase rounded">
                    ● Offline Database Connected
                  </span>
                </div>
                {/* Invoice Mock interface */}
                <div className="space-y-3.5">
                  <div className="bg-[#0F172A] p-3 rounded-sm border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-550 font-bold block uppercase tracking-wider">Scan Barcode / HSN</span>
                      <span className="font-mono text-sm text-blue-400">8901030752528 [Pepsodent 150g]</span>
                    </div>
                    <span className="px-1.5 py-1 bg-blue-600 rounded-sm text-[9px] font-bold text-white uppercase shrink-0">Scanned</span>
                  </div>

                  <div className="bg-[#0F172A] p-1.5 rounded-sm border border-slate-800 overflow-x-auto">
                    <table className="w-full text-left text-[11px] font-mono text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1 text-left font-bold">Item Description</th>
                          <th className="pb-1 text-right font-bold">Qty</th>
                          <th className="pb-1 text-right font-bold">GST</th>
                          <th className="pb-1 text-right font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-1.5 text-slate-200">Aashirvaad Atta 5kg</td>
                          <td className="py-1.5 text-right">2</td>
                          <td className="py-1.5 text-right">0%</td>
                          <td className="py-1.5 text-right text-emerald-400">₹640.00</td>
                        </tr>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-1.5 text-slate-200">Tata Salt 1kg Lite</td>
                          <td className="py-1.5 text-right">1</td>
                          <td className="py-1.5 text-right">0%</td>
                          <td className="py-1.5 text-right text-emerald-400">₹28.00</td>
                        </tr>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-1.5 text-slate-200">Dettol Liquid Handwash</td>
                          <td className="py-1.5 text-right">3</td>
                          <td className="py-1.5 text-right">18%</td>
                          <td className="py-1.5 text-right text-emerald-400">₹297.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pricing summary widget */}
                  <div className="bg-[#0F172A] text-slate-300 p-3 rounded-sm border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-550 font-bold block uppercase tracking-wider">Checkout Amount</span>
                      <span className="text-xl font-black text-amber-400">₹965.00</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider">Total SGST/CGST Included</span>
                      <span className="text-[11px] font-mono font-bold text-[#10B981]">₹45.30 [Exempt/18%]</span>
                    </div>
                  </div>

                  {/* POS Buttons simulation */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="p-2 border border-slate-800 bg-slate-900 rounded-sm text-center font-bold text-[10px] uppercase text-indigo-400">
                      [F2] Cash Tender
                    </div>
                    <div className="p-2 border border-slate-800 bg-slate-900 rounded-sm text-center font-bold text-[10px] uppercase text-[#10B981]">
                      [F12] Thermal Print Bill
                    </div>
                  </div>
                </div>

                {/* Secure Floating Certification */}
                <div className="absolute top-2 right-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                  99.9% Faster Response
                </div>
              </div>
              {/* Floating Badges */}
              <div className="absolute -bottom-4 -left-4 bg-[#10B981] text-black px-4 py-2 font-black uppercase text-[10px] sm:text-xs -rotate-3 shadow-lg z-20 font-mono">
                GST READY 2026
              </div>
              <div className="absolute -top-4 -right-4 bg-[#2563EB] text-white px-4 py-2 font-black uppercase text-[10px] sm:text-xs rotate-2 shadow-lg z-20 font-mono">
                OFFLINE FIRST
             </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. MAIN FEATURES SUMMARY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2563EB]">// High-Performance POS Features</h2>
          <p className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white">
            Engineered For Speed & GST Compliance.
          </p>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Packed with direct POS billing workflow utilities. Everything your billing counter operator needs inside a single lightweight Windows client database application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {mainFeatures.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-[#1E293B] border border-slate-805 p-6 rounded-sm hover:border-[#2563EB] transition-all duration-350 group shadow-lg"
              id={`feat-card-${idx}`}
            >
              <div className="w-12 h-12 bg-[#0F172A] border border-slate-800 rounded-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="font-black text-xs uppercase text-slate-400 mb-2 tracking-widest font-mono">// POS Module</h3>
              <p className="text-white font-black text-lg leading-snug mb-3 uppercase tracking-tight">{feat.title}</p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
        
        {/* Quick features page redirect CTA banner */}
        <div className="text-center mt-10">
          <button 
            onClick={() => onPageChange('features')} 
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#2563EB] hover:text-blue-400 transition-colors cursor-pointer"
          >
            <span>Learn about all GST features</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. INDUSTRIES SERVED - BENTO GRID DESIGN */}
      <section className="bg-slate-100 border-y border-slate-200/60 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600">Business Modules</h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Catering to All Core Indian Retail & Wholesale Verticals
            </p>
            <p className="text-slate-500 text-sm">
              Customized modules configured dynamically during system setup to match precise inventory, billing fields, barcode structures, and taxation profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind, i) => (
              <div 
                key={i} 
                className="bg-white p-6 border border-slate-150 rounded-xl hover:border-blue-400 hover:shadow-md transition-all flex gap-4"
                id={`industry-card-${i}`}
              >
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                  {ind.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base leading-snug">{ind.title}</h4>
                  <p className="text-slate-550 text-xs leading-relaxed">{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SOFTWARE DOWNLOAD PROMO */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1E293B] text-white border-2 border-[#2563EB] rounded-sm p-8 sm:p-12 relative overflow-hidden shadow-[8px_8px_0px_#1e3a8a] flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Background effect */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-slate-900 rounded-full blur-2xl opacity-40" />

          <div className="space-y-4 relative z-10 max-w-lg text-center md:text-left">
            <span className="px-2.5 py-1 bg-[#2563EB] text-white border border-[#2563EB] text-[10px] font-mono tracking-widest uppercase font-bold rounded-sm">
              // Free Trial Available
            </span>
            <h3 className="text-2xl sm:text-3.5xl font-black uppercase tracking-tight leading-none text-white">
              Test Setup on your PC in under 2 minutes.
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              No registration or internet key required to evaluate. Simply download the EXE installer payload, add sample items, and test printer outputs on your own checkout desk!
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 min-w-xs justify-center shrink-0">
            <button
              onClick={() => onPageChange('downloads')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-[#0F172A] font-black text-xs uppercase tracking-widest rounded-sm shadow-md hover:bg-slate-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="cta-download-exe-shortcut-btn"
            >
              <Download className="w-4 h-4" />
              Download EXE
            </button>
            <button
              onClick={() => onPageChange('portal')}
              className="w-full sm:w-auto px-6 py-3.5 bg-transparent hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-sm border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              Register Portal
            </button>
          </div>
        </div>
      </section>

      {/* 5. USER TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2563EB]">// Merchant Stories</h2>
          <p className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white">
            Trusted by 14,000+ Outlets.
          </p>
          <p className="text-slate-400 text-sm">
            Read how small-scale business owners eliminated manual credit khata books and automated billing speeds with BSP Suryatech.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {testimonials.map((test, i) => (
            <div 
              key={test.id} 
              className="bg-[#1E293B] p-6 rounded-sm border border-slate-800 flex flex-col justify-between hover:border-[#10B981] transition-all"
              id={`testimonial-item-${i}`}
            >
              <div className="space-y-4">
                {/* Stars ratings */}
                <div className="flex gap-1">
                  {[...Array(test.rating)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400 border-none outline-none" />
                  ))}
                </div>
                <p className="text-slate-305 text-xs sm:text-sm leading-relaxed italic font-sans font-medium">
                  "{test.text}"
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-slate-800">
                <div className="w-10 h-10 bg-[#2563EB] rounded-sm flex items-center justify-center font-black text-white text-sm shadow-inner uppercase font-mono">
                  {test.name[0]}
                </div>
                <div>
                  <h4 className="font-black text-white text-sm uppercase tracking-tight leading-none">{test.name}</h4>
                  <span className="text-xs text-slate-400 font-bold tracking-wide block mt-1 uppercase">
                    {test.company} • {test.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. DETAILED FAQ ACCORDION SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2563EB]">// Support Center FAQs</h2>
          <p className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white">
            Have Questions? Answers.
          </p>
        </div>

        <div className="border border-slate-800 rounded-sm bg-[#1E293B] divide-y divide-slate-800 shadow-md overflow-hidden">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="transition-all" id={`faq-accordion-item-${idx}`}>
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-black uppercase tracking-tight text-white hover:text-[#2563EB] hover:bg-slate-800 transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  <span className="pr-4 leading-snug">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-350 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-slate-310 text-xs sm:text-sm leading-relaxed font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. QUICK CONTACT INTEGRATION FOOTER BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-slate-200 bg-white rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto shadow-md relative overflow-hidden">
          {/* Subtle decoration lines */}
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
          <h3 className="text-2xl font-black text-slate-900">Need Immediate Buying Guidance or Retail Setup Support?</h3>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Our expert POS installers are online. Chat with us on Whatsapp to get custom pricing quotes for bulk computer nodes or receive a live remote install demo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="https://wa.me/919516916415?text=Hello%20BSP%20Suryatech%20I%20am%20interested%20in%20your%20Billing%20Software%20pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer text-sm"
              id="whatsapp-instant-chat-btn"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Instant Chat on WhatsApp</span>
            </a>
            <button
              onClick={() => onPageChange('contact')}
              className="w-full sm:w-auto px-8 py-3.5 border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Contact Support Desk</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
