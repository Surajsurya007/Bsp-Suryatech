/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from './TranslationContext';
import { 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  MessageSquare, 
  User, 
  LogOut, 
  Lock, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  IndianRupee,
  Smartphone,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  user: any;
  onLogout: () => void;
  notifications: Array<{ id: string; text: string; type: 'success' | 'info' | 'error' }>;
  removeNotification: (id: string) => void;
}

export default function Layout({ 
  children, 
  currentPage, 
  onPageChange, 
  user, 
  onLogout,
  notifications,
  removeNotification
}: LayoutProps) {
  const { t, currentLanguage, languages, changeLanguage, loading } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const announcementMsg = '🇮🇳 Special Offer: Desktop GST Billing Lifetime License now only ₹1999 / Free Trial Enabled';

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'downloads', label: 'Download Center' },
    { id: 'tutorials', label: 'Tutorials' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderLanguageSelector = () => {
    const activeLanguages = languages.filter(l => l.enabled);
    const currentLangConfig = activeLanguages.find(l => l.code === currentLanguage) || { code: 'en', name: 'English', flag: '🇺🇸' };

    return (
      <div className="relative inline-block text-left" id="language-switcher-container">
        <button
          onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-[#E2E8F0] border border-slate-700/80 hover:border-slate-600 rounded-sm text-xs font-black tracking-wider transition-all duration-250 uppercase cursor-pointer"
          id="language-switcher-button"
        >
          <span>{currentLangConfig.flag}</span>
          <span>{currentLangConfig.code}</span>
          {loading ? (
            <span className="w-1.5 h-1.5 bg-emerald-450 border border-emerald-400 rounded-full animate-ping ml-0.5" />
          ) : (
            <span className="text-[9px] text-slate-400 ml-0.5">▼</span>
          )}
        </button>

        {langDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-[#1E293B] border border-slate-800 rounded-sm shadow-2xl py-1 z-50 animate-fade-in" id="language-dropdown-menu">
              <div className="px-3.5 py-1.5 border-b border-slate-800/60 text-[9px] font-mono text-slate-500 font-black uppercase tracking-wider">
                Select Language
              </div>
              {activeLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-800/80 ${
                    currentLanguage === lang.code 
                      ? 'text-blue-400 font-extrabold bg-slate-800' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm shrink-0">{lang.flag}</span>
                    <span className="font-semibold">{lang.name}</span>
                  </div>
                  {currentLanguage === lang.code && (
                    <span className="text-[10px] text-blue-500 font-bold font-mono">✔</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-white flex flex-col antialiased">
      {/* Dynamic Header Announcement */}
      <div className="bg-[#1E293B] text-slate-300 text-xs py-2 px-4 font-bold tracking-widest text-center flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 border-b border-slate-800">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#10B981]" />
        <span>{t(announcementMsg)}</span>
      </div>

      {/* Main Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div 
              onClick={() => handleNavClick('home')} 
              className="flex items-center gap-3 cursor-pointer group mr-0 pr-[10px] pl-0"
              id="header-logo"
            >
              <div className="p-2 bg-[#2563EB] rounded-lg text-white shadow-[2px_2px_0px_#1e3a8a] group-hover:bg-blue-600 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white uppercase group-hover:text-blue-400 transition-colors">
                  BSP <span className="text-[#2563EB] group-hover:text-emerald-400">Suryatech</span>
                </span>
                <span className="text-[10px] font-mono tracking-normal text-slate-500 uppercase font-bold mt-0 text-center block">
                  // HIGH-PERFORMANCE
                  <br />
                  BILLING SOFTWARES
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-4 py-2 rounded-sm text-xs font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                    currentPage === item.id 
                      ? 'bg-[#2563EB] text-white border border-[#2563EB] shadow-[4px_4px_0px_#1e3a8a]' 
                      : 'text-slate-400 border border-transparent hover:text-white hover:border-slate-800 hover:bg-[#1E293B]'
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  {t(item.label)}
                </button>
              ))}
            </nav>

            {/* Account / Portal Area */}
            <div className="hidden lg:flex items-center gap-3">
              {renderLanguageSelector()}
              {user ? (
                <div className="flex items-center gap-2">
                  <div 
                    onClick={() => handleNavClick('portal')}
                    className="flex items-center gap-2.5 px-3 py-1.5 bg-[#1E293B] border border-slate-800 rounded-sm text-xs text-slate-200 cursor-pointer hover:bg-slate-800 transition-colors"
                    id="profile-pill-layout"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <div className="flex flex-col text-left font-sans">
                      <span className="font-bold text-white leading-none">{user.name}</span>
                      <span className="text-[8px] text-slate-400 font-bold leading-none mt-1 uppercase tracking-wide">
                        {user.role === 'admin' ? t('🇮🇳 SYSTEM ADMIN') : t('Customer Account')}
                      </span>
                    </div>
                  </div>
                  
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleNavClick('admin')}
                      className="px-3.5 py-1.5 bg-[#10B981] text-black font-black rounded-sm text-xs tracking-wider uppercase hover:bg-emerald-400 transition-colors"
                      id="admin-dashboard-btn"
                    >
                      {t('Admin Panel')}
                    </button>
                  )}

                  <button
                    onClick={onLogout}
                    className="p-1.5 border border-slate-850 text-slate-400 hover:text-red-500 hover:bg-[#1E293B]/60 rounded-sm transition-colors cursor-pointer"
                    title="Sign Out Account"
                    id="logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('portal')}
                  className="px-6 py-2 bg-white text-[#0F172A] font-black text-xs uppercase tracking-tight rounded-sm hover:bg-slate-100 shadow-[4px_4px_0px_#2563EB] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
                  id="client-portal-gate-btn"
                >
                  {t('Client Portal')}
                </button>
              )}
            </div>

            {/* Mobile Menu Action */}
            <div className="flex lg:hidden items-center gap-3">
              {renderLanguageSelector()}
              {user && (
                <button 
                  onClick={() => handleNavClick('portal')} 
                  className="p-1.5 border border-slate-800 rounded-sm text-blue-400 bg-slate-900"
                  id="mobile-user-profile-shortcut"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 border border-slate-800 rounded-sm text-slate-400 hover:text-white"
                id="mobile-hamburguer-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-[#0F172A]/95 backdrop-blur-md px-4 py-4 space-y-2 transition-all">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  currentPage === item.id 
                    ? 'bg-[#2563EB] text-white shadow-[4px_4px_0px_#1e3a8a]' 
                    : 'text-slate-350 hover:bg-[#1E293B] hover:text-white'
                }`}
                id={`mobile-nav-item-${item.id}`}
              >
                {t(item.label)}
              </button>
            ))}
            <hr className="border-slate-800 my-2" />
            <div className="pt-2">
              {user ? (
                <div className="space-y-2">
                  <div 
                    onClick={() => handleNavClick('portal')}
                    className="flex items-center gap-3 px-4 py-3 bg-[#1E293B] rounded-sm"
                  >
                    <User className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-bold text-white text-sm">{user.name}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleNavClick('admin')}
                      className="w-full text-center py-3 bg-[#10B981] text-black font-black rounded-sm text-xs tracking-wider uppercase"
                    >
                      {t('Open Admin Control Panel')}
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-slate-800 rounded-sm text-xs font-black uppercase text-red-500 hover:bg-[#1E293B]"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('Logout Account')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('portal')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white text-[#0F172A] font-black rounded-sm text-xs uppercase"
                >
                  <Lock className="w-4 h-4" />
                  {t('Access Customer Portal')}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Floating Notifications Toaster */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-sm shadow-xl border animate-slide-in text-xs font-sans ${
              notif.type === 'success' 
                ? 'bg-emerald-950 border-emerald-700 text-emerald-200' 
                : notif.type === 'error'
                ? 'bg-rose-950 border-rose-700 text-rose-200'
                : 'bg-[#1E293B] border-slate-700 text-slate-100'
            }`}
            id={`toast-${notif.id}`}
          >
            <div className="flex items-center gap-2.5 font-bold uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />
              <span>{t(notif.text)}</span>
            </div>
            <button 
              onClick={() => removeNotification(notif.id)} 
              className="ml-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Page Content Body */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Premium Footer Layout */}
      <footer className="bg-black/40 border-t border-slate-850 pt-16 pb-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Column 1: Brand details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2563EB] rounded-sm text-white shadow-[2px_2px_0px_#1e3a8a]">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-black text-lg tracking-tighter uppercase">
                  BSP <span className="text-[#2563EB]">Suryatech</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                India’s leading offline-first desktop billing software company. Providing robust, lightning-fast POS with barcode, GST reporting, and automatic backups. Trusted by over 14,000+ businesses.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <span className="bg-[#1E293B] border border-slate-800 px-2.5 py-1 text-[10px] uppercase font-mono rounded text-slate-300 font-bold">
                  // GSTIN Registered
                </span>
                <span className="text-xs text-slate-400 font-bold tracking-tight uppercase">🇮🇳 Made in India</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-black text-white text-xs tracking-widest uppercase mb-5">// Software Products</h4>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-400 uppercase font-bold tracking-wider">
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('features')}>POS Billing System</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('features')}>GST Billing Software</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('features')}>Wholesale & Retail Ledger</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('features')}>Inventory & Expiry Tracker</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('features')}>Thermal Receipt Printer Suite</li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h4 className="font-black text-white text-xs tracking-widest uppercase mb-5">// Customer Support</h4>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-400 uppercase font-bold tracking-wider">
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('downloads')}>Download Center</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('tutorials')}>Tutorial Videos</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('tutorials')}>Installation Guides</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('contact')}>Support Ticket Portal</li>
                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleNavClick('pricing')}>Upgrade Pricing Plans</li>
              </ul>
            </div>

            {/* Column 4: Address Info */}
            <div className="space-y-4">
              <h4 className="font-black text-white text-xs tracking-widest uppercase mb-5">// Corporate Office</h4>
              <p className="text-slate-400 text-xs sm:text-sm flex gap-3 leading-relaxed">
                <Building2 className="w-5 h-5 text-[#2563EB] shrink-0" />
                <span className="font-sans leading-relaxed">
                  BSP Suryatech Tower, Sector 62,<br />
                  Electronic City, Noida,<br />
                  Uttar Pradesh - 201301, India
                </span>
              </p>
              <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="font-mono">+91 95535 28282</span>
              </p>
              <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span className="font-sans">support@bspsuryatech.in</span>
              </p>
            </div>
          </div>

          <hr className="border-slate-800/80 my-8" />

          {/* Secure Certifications labels & Legals */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-xs text-slate-500 text-center md:text-left space-y-1">
              <p>© 2026 BSP Suryatech (bspsuryatech.in). All rights reserved.</p>
              <p>All trademarks referenced herein belong to BSP Suryatech. Windows is a trademark of Microsoft Corporation.</p>
            </div>
            {/* Certs and Indian payments */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1E293B] border border-slate-800 rounded-sm text-[10px] font-mono text-slate-350 uppercase font-black">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1E293B] border border-slate-800 rounded-sm text-[10px] font-mono text-slate-350 uppercase font-black">
                <IndianRupee className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>UPI / Debit</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
