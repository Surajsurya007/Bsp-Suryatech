/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  CreditCard, 
  Terminal, 
  Check, 
  HelpCircle, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  Play, 
  Images,
  Maximize2
} from 'lucide-react';
import { Product } from '../types';

interface SoftwareDetailsProps {
  productId: string;
  products: Product[];
  onPageChange: (page: string) => void;
  onTriggerTrialDownload: (id: string, fullVersion: boolean) => void;
  onInitiateSimulatedCheckout: (id: string) => void;
  user: any;
}

export default function SoftwareDetails({ 
  productId, 
  products, 
  onPageChange, 
  onTriggerTrialDownload, 
  onInitiateSimulatedCheckout,
  user
}: SoftwareDetailsProps) {
  // Find current software product
  const product = products.find(p => p.id === productId) || products[0];

  // State managers
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryViewMode, setGalleryViewMode] = useState<'slider' | 'grid'>('slider');

  // Related products
  const relatedSoftware = products.filter(p => p.id !== product.id);

  // Set page location hashes to create SEO-friendly URL patterns inside standard iframe environments
  useEffect(() => {
    if (product) {
      const slugName = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      window.history.pushState(null, '', `#/software/${slugName}`);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 font-sans p-6" id="software-details-fallback-screen">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-slate-500 text-sm font-medium">Software reference catalog index not found or is currently reloading.</p>
          <button 
            onClick={() => onPageChange('home')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono rounded-xl transition duration-250 cursor-pointer"
          >
            RETURN HOME
          </button>
        </div>
      </div>
    );
  }

  // Set default properties if missing
  const categoryStr = product.category || 'POS Software Utilities';
  const fullDescStr = product.fullDescription || product.description;
  const sysReqsStr = product.systemRequirements || 'Operating System: Windows 7, 8, 10, or 11\nCPU: Intel Dual-Core 2.0 Ghz or equivalent\nMemory: 2 GB RAM minimum\nStorage: 100 MB free database folders space';
  const licenseInfoStr = product.licenseInfo || 'Standard Lifetime Desktop License Key with 1-Year free security patches and updates.';
  const demoUrlStr = product.demoVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  const galleryImages = product.gallery && product.gallery.length > 0 
    ? product.gallery 
    : [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800'
      ];

  const handleNextCarousel = () => {
    setActiveGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevCarousel = () => {
    setActiveGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans pb-16" id="software-details-viewport">
      {/* Dynamic Header Frame */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            id="software-details-back-to-catalog"
            onClick={() => onPageChange('home')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO HOME</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>LOCATION:</span>
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">#/software/{product.id}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0 select-none mb-6" id="software-details-breadcrumbs">
          <button onClick={() => onPageChange('home')} className="hover:text-blue-600">HOME</button>
          <span>/</span>
          <span className="text-slate-500">SOFTWARE</span>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Primary Product Shell Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Gallery, Descriptions and Video (Col span 7) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Gallery card container */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4" id="software-gallery-card">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2">
                  <Images className="w-4 h-4 text-slate-500" />
                  <h3 className="font-extrabold text-slate-850 text-sm tracking-tight">Software Screenshots & User Interfaces</h3>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold font-mono">
                  <button 
                    onClick={() => setGalleryViewMode('slider')}
                    className={`px-2.5 py-1 rounded-md transition ${galleryViewMode === 'slider' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    SLIDER
                  </button>
                  <button 
                    onClick={() => setGalleryViewMode('grid')}
                    className={`px-2.5 py-1 rounded-md transition ${galleryViewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                  >
                    GRID
                  </button>
                </div>
              </div>

              {/* Slider Mode */}
              {galleryViewMode === 'slider' ? (
                <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden group">
                  <img 
                    src={galleryImages[activeGalleryIndex]} 
                    alt={`${product.name} interface visual ${activeGalleryIndex + 1}`}
                    className="w-full h-full object-cover select-none transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Aspect Shadows overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Navigation Arrows */}
                  <button 
                    onClick={handlePrevCarousel}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur hover:bg-white text-slate-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleNextCarousel}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur hover:bg-white text-slate-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Maximize Icon */}
                  <button 
                    onClick={() => setLightboxIndex(activeGalleryIndex)}
                    className="absolute right-3 bottom-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur transition cursor-pointer"
                    title="Enlarge Image preview"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Slide Indicators Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-[10px] font-mono text-white tracking-widest uppercase">
                    {activeGalleryIndex + 1} / {galleryImages.length}
                  </div>
                </div>
              ) : (
                /* Grid Mode */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {galleryImages.map((src, idx) => (
                    <div 
                      key={idx} 
                      className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden group cursor-pointer border border-slate-200/50"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img 
                        src={src} 
                        alt={`${product.name} layout grid item ${idx+1}`}
                        className="w-full h-full object-cover transition duration-350 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5 scale-90 group-hover:scale-100 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullet thumbnail index selectors */}
              {galleryViewMode === 'slider' && (
                <div className="flex gap-2 justify-center">
                  {galleryImages.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${idx === activeGalleryIndex ? 'bg-blue-600 w-6' : 'bg-slate-200 w-2.5'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product description details card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="space-y-2 text-left">
                <span className="text-xs font-bold text-blue-600 font-mono tracking-wider uppercase bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                  {categoryStr}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">{product.name} Detailed Overview</h2>
              </div>

              <div className="prose prose-slate max-w-none text-left">
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {fullDescStr}
                </p>
              </div>

              {/* Features Lists section */}
              <div className="border-t border-slate-100 pt-6 space-y-4 text-left">
                <h4 className="font-extrabold text-slate-900 text-sm tracking-tight font-sans">
                  Key Module Capabilities & Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {product.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                      <div className="mt-0.5 p-0.5 bg-emerald-50 text-emerald-600 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Demonstration block */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3 text-left">
                <Play className="w-4 h-4 text-red-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Demo walkthrough Video & POS setup Tutorials</h3>
              </div>
              <p className="text-slate-500 text-xs text-left">
                Watch a comprehensive 10-minute workflow tutorial highlighting inventory bulk data seeding, receipt generation, thermal custom spacing configurations, and invoice exports. No registration required.
              </p>
              
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/30">
                {demoUrlStr.includes('youtube.com') ? (
                  <iframe 
                    src={demoUrlStr}
                    title={`${product.name} setup demo guide`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 text-slate-400">
                    <Terminal className="w-12 h-12 text-slate-300 mb-2" />
                    <p className="text-xs font-mono">Walkthrough Player offline. Video reference ID: {demoUrlStr}</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Requirements card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Cpu className="w-4 h-4 text-slate-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">System Requirements & Client Configurations</h3>
              </div>
              <div className="bg-slate-50 p-4.5 rounded-2xl border font-mono text-xs text-slate-600 space-y-2 whitespace-pre-wrap">
                {sysReqsStr}
              </div>
            </div>

          </div>

          {/* RIGHT: Pricing, Licenses and Fast Actions Checkout Panels (Col span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Action buy/download panel */}
            <div className="bg-white border-2 border-blue-500/80 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden text-left space-y-6">
              {/* Corner badge */}
              <div className="absolute -right-12 -top-1 px-12 py-3.5 bg-blue-600 text-white font-mono font-bold text-[9px] uppercase tracking-widest rotate-25 select-none text-center">
                OFFLINE PRO
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold font-mono text-blue-600 uppercase tracking-widest">
                  {product.version} RELEASE INDICES
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-none mt-1">
                  Lifetime Single Workstation
                </h3>
                <p className="text-slate-450 text-[11px] font-mono leading-none">
                  File Size: {product.size} | Runs offline
                </p>
              </div>

              {/* Highlight Pricing */}
              <div className="bg-slate-50 border p-4 rounded-2xl flex items-center justify-between" id="software-pricing-highlights">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">GST COMPLIANT LIFETIME PRICE</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-slate-400 line-through font-mono">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2 py-1 text-[10.5px] font-bold font-mono uppercase shrink-0">
                  Save {product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 60}%
                </div>
              </div>

              {/* Feature shortlist */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-450 tracking-wider block font-mono uppercase">
                  DELIVERED LICENSE PERKS
                </span>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{licenseInfoStr}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>No monthly/annual renewal fees, runs 100% offline.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Free backup & remote support session setup guidance.</span>
                  </div>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => onInitiateSimulatedCheckout(product.id)}
                  className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                  id="checkout-fast-action-button"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>BUY SECURE LIFETIME LICENSE KEY</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onTriggerTrialDownload(product.id, false)}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-[10.5px] uppercase transition flex items-center justify-center gap-1 cursor-pointer border"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD TRIAL</span>
                  </button>
                  <button 
                    onClick={() => onTriggerTrialDownload(product.id, true)}
                    className="py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold rounded-xl text-[10.5px] uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD FULL (.EXE)</span>
                  </button>
                </div>
              </div>

              {/* Trusted payment badge footer */}
              <div className="text-center text-[10.5px] text-slate-400 font-mono pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
                <span>🔒 SECURE SHAL-256 CHECKOUT</span>
                <span>•</span>
                <span>INSTANT EMAIL DELIVERY</span>
              </div>
            </div>

            {/* Support helpline card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 text-left">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <HelpCircle className="w-4 h-4 text-slate-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Need Help or Customized Setup?</h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Our support desk engineers are online to provide free remote desktop installations, hardware diagnostic setups (thermal printers, USB weighing scales, barcode laser scanners) and template adjustments.
              </p>
              
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500">WHATSAPP HELPLINE:</span>
                  <span className="font-mono font-extrabold text-slate-800 hover:text-blue-600 transition cursor-pointer select-all">
                    +91 95169 16415
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-emerald-100/40 pt-2">
                  <span className="font-mono text-slate-500">SUPPORT EMAIL:</span>
                  <span className="font-mono font-extrabold text-slate-850 hover:text-blue-600 transition truncate select-all">
                    Support@bspsuryatech.in
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM: Related Software listings section */}
        {relatedSoftware.length > 0 && (
          <div className="border-t border-slate-200/60 pt-12 mt-12 space-y-6 text-left" id="software-related-cross-selling-box">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">COMPLEMENTARY SUITES</span>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Explore Other BSP Suryatech Software Solutions</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedSoftware.map((relatedProd) => (
                <div 
                  key={relatedProd.id}
                  className="bg-white border rounded-3xl p-6 transition-all hover:border-blue-400 hover:shadow-md flex flex-col justify-between"
                  id={`related-software-link-${relatedProd.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {relatedProd.category || 'Retail Automation'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-lg mt-1.5">{relatedProd.name}</h4>
                      </div>
                      <span className="font-mono font-extrabold text-blue-600 text-lg">₹{relatedProd.price}</span>
                    </div>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {relatedProd.description}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4 self-end">
                    <button 
                      onClick={() => {
                        window.scrollTo(0, 0);
                        onPageChange('home');
                        // Quick dynamic page reset
                        setTimeout(() => {
                          const el = document.getElementById(`downloader-info-card-${relatedProd.id === 'prod-billing-pro' ? 'dl-1' : 'dl-2'}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 font-bold font-mono text-[10.5px] rounded-lg transition"
                    >
                      DOWNLOAD COPIES
                    </button>
                    <button 
                      onClick={() => {
                        window.scrollTo(0, 0);
                        // We will set selectedSoftwareId and re-render SoftwareDetails for this ID!
                        onPageChange(`software-details:${relatedProd.id}`);
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 font-bold font-sans text-[10.5px] text-white rounded-lg shadow-sm hover:shadow transition"
                    >
                      VIEW DETAILS Page
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* LIGHTBOX OVERLAY SCREEN */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 flex flex-col justify-center items-center z-[100] animate-fade-in"
          id="software-details-gallery-lightbox"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close trigger button */}
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer select-none border-0 font-extrabold text-sm"
          >
            ✕ CLOSE PREVIEW
          </button>

          <div className="relative max-w-4xl max-h-[80vh] px-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Carousel navigation controls inside lightbox */}
            <button 
              onClick={() => setLightboxIndex((prev) => prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0)}
              className="absolute left-6 p-2 bg-white/10 hover:bg-white/20 hover:scale-110 text-white rounded-full transition-all cursor-pointer font-sans text-xl"
            >
              ❮
            </button>
            
            <img 
              src={galleryImages[lightboxIndex]} 
              alt="Enlarged screenshot slide view" 
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />

            <button 
              onClick={() => setLightboxIndex((prev) => prev !== null ? (prev + 1) % galleryImages.length : 0)}
              className="absolute right-6 p-2 bg-white/10 hover:bg-white/20 hover:scale-110 text-white rounded-full transition-all cursor-pointer font-sans text-xl"
            >
              ❯
            </button>
          </div>

          <p className="text-white/60 font-mono text-xs mt-4">
            Screenshot {lightboxIndex + 1} of {galleryImages.length} | Click anywhere around the dark area to close preview
          </p>
        </div>
      )}
    </div>
  );
}
