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
  ShoppingCart
} from 'lucide-react';

interface DownloadCenterProps {
  downloads: any[];
  totalDownloads: number;
  onTriggerTrialDownload: (prodId: string, isFull?: boolean) => void;
  onPageChange?: (page: string) => void;
  onAddToCart?: (planId: string) => void;
}

export default function DownloadCenter({ downloads, totalDownloads, onTriggerTrialDownload, onPageChange, onAddToCart }: DownloadCenterProps) {
  const [downloadFilter, setDownloadFilter] = useState<'all' | 'stable' | 'manuals'>('all');

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

      {/* WINDOWS INSTALL EXES BINARIES LIST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left mb-8 max-w-lg">
          <h2 className="font-black text-slate-800 text-xl">Active Binary Releases</h2>
          <p className="text-slate-400 text-xs mt-1">Lightweight executable installers. Verified virus-free and signed by BSP Suryatech.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {downloads.map((dl) => {
            const isEnterprise = dl.filename.toLowerCase().includes('enterprise');
            return (
              <div 
                key={dl.id}
                className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all"
                id={`downloader-info-card-${dl.id}`}
              >
                <div className="space-y-6">
                  {/* Top Release details Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-mono font-bold uppercase border border-blue-150-100">
                        {isEnterprise ? 'GST Enterprise Release' : 'Retail Standard Release'}
                      </span>
                      <h4 className="text-lg font-extrabold text-slate-800 mt-2">{dl.filename}</h4>
                      <div className="flex gap-4 text-xs text-slate-450 font-mono">
                        <span>Version: {dl.version}</span>
                        <span>Size: {dl.fileSize}</span>
                        <span className="text-emerald-600">Downloads: {dl.downloadCount}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const mappedProdId = dl.id === 'dl-1' ? 'prod-billing-pro' : 'prod-billing-enterprise';
                        onPageChange?.(`software-details:${mappedProdId}`);
                      }}
                      className="p-3 bg-blue-50 hover:bg-blue-105 text-blue-600 hover:text-blue-700 hover:scale-105 active:scale-95 rounded-xl cursor-pointer transition-all duration-200 border-0 flex items-center justify-center shadow-sm"
                      title="View Full Software Details"
                      id={`view-software-details-btn-${dl.id}`}
                    >
                      <Terminal className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Release bullet log changes */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-450 uppercase font-bold tracking-widest font-mono">Release Notes / Changelog:</span>
                    <ul className="space-y-2">
                      {dl.releaseNotes.map((note: string, noteI: number) => (
                        <li key={noteI} className="flex gap-2 text-xs text-slate-600" id={`changeline-item-${dl.id}-${noteI}`}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-normal">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Big download action buttons */}
                <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
                  <button
                    onClick={() => onAddToCart?.(dl.id === 'dl-1' ? 'prod-billing-pro' : 'prod-billing-enterprise')}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 active:scale-98 transition-all duration-200 cursor-pointer text-xs shadow-md border-0 uppercase tracking-wider"
                    id={`add-to-cart-download-btn-${dl.id}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart & Choose Price Plan</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => onTriggerTrialDownload(dl.id, false)}
                      className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer text-xs"
                      id={`trigger-exe-trial-download-${dl.id}`}
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Download Free Trial (.EXE)</span>
                    </button>

                    <button
                      onClick={() => onTriggerTrialDownload(dl.id, true)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer text-xs shadow-sm"
                      id={`trigger-exe-full-download-${dl.id}`}
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-200" />
                      <span>Download Full Version (.EXE)</span>
                    </button>
                  </div>
                  <span className="text-[9.5px] text-center text-slate-400 block mt-2">Compatible with Windows 7/8/10/11 workstation terminals. Verification checks apply.</span>
                </div>

              </div>
            );
          })}
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
Corporate Address: Sector 62, Noida, Uttar Pradesh, India.`;
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
