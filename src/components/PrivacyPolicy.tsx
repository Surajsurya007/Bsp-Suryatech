/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Server, ChevronLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onPageChange?: (page: string) => void;
}

export default function PrivacyPolicy({ onPageChange }: PrivacyPolicyProps) {
  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <div className="py-16 space-y-12 pb-24 text-left max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button if dynamic navigation is available */}
        {onPageChange && (
          <button
            onClick={() => {
              onPageChange('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#2563EB] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        )}

        {/* HEADER SECTION */}
        <section className="space-y-4 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2563EB] rounded-xl text-white">
              <ShieldCheck className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#2563EB] block">
                // Security & Trust
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
                Privacy Policy
              </h1>
            </div>
          </div>
          <p className="text-slate-500 text-sm">
            Last Updated: July 10, 2026. Please read this Privacy Policy carefully to understand our commitment to your data privacy.
          </p>
        </section>

        {/* CORE PRIVACY STATEMENT */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-2">Our Absolute Commitment</h2>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">
                At BSP Suryatech, we are fully committed to protecting your privacy and business data. Since our core desktop billing applications operate entirely offline, we never collect, store, or access your transaction, customer, or inventory data.
              </p>
            </div>
          </div>
        </section>

        {/* POLICY DETAILS */}
        <section className="space-y-8">
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-blue-600 font-bold uppercase tracking-wider text-xs">
                <Database className="w-4 h-4" />
                <span>1. Offline-First Desktop Software Data</span>
              </div>
              <p className="text-slate-650 text-sm leading-relaxed">
                All transaction details, stock entries, customer databases, tax records, and configuration logs are stored exclusively on your local computer or chosen storage drive. We have no backend access to this data, nor do we run background telemetry services that upload your business logs.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-blue-600 font-bold uppercase tracking-wider text-xs">
                <Server className="w-4 h-4" />
                <span>2. Web Platform & Account Information</span>
              </div>
              <p className="text-slate-650 text-sm leading-relaxed">
                When you create an account, register your license, purchase a subscription, or submit a support ticket on our website, we collect minimal personal details (such as business name, email address, phone number, and billing region) to process transactions and provide remote installation assistance.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-blue-600 font-bold uppercase tracking-wider text-xs">
                <Eye className="w-4 h-4" />
                <span>3. Remote Setup & Technical Support</span>
              </div>
              <p className="text-slate-650 text-sm leading-relaxed">
                During remote-access setup sessions (via AnyDesk, TeamViewer, or other secure remote tools), our engineers only perform necessary actions to install the software, setup printer drivers, and activate the license. We do not copy, extract, or browse any files unrelated to our billing applications.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-blue-600 font-bold uppercase tracking-wider text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>4. Security of Information</span>
              </div>
              <p className="text-slate-650 text-sm leading-relaxed">
                We implement robust industry-standard electronic security measures to safeguard web registration records against unauthorized access, loss, or alteration. Financial transactions are processed via secure encrypted payment gateway partners and we never store your payment card or banking passwords.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER OF POLICY */}
        <section className="pt-8 border-t border-slate-200 text-center space-y-4">
          <p className="text-xs text-slate-500 italic leading-relaxed">
            By accessing bspsuryatech.in or using our software applications, you agree to this Privacy Policy.
          </p>
          {onPageChange && (
            <button
              onClick={() => {
                onPageChange('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-97 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-md shadow-blue-500/10"
            >
              I Acknowledge & Accept
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
