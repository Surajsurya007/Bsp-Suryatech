/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, ChevronLeft, HelpCircle } from 'lucide-react';

interface RefundPolicyProps {
  onPageChange?: (page: string) => void;
}

export default function RefundPolicy({ onPageChange }: RefundPolicyProps) {
  return (
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
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
            <ShieldCheck className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 block">
              // Legal Terms & Agreements
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
              Disclaimer & Refund Policy
            </h1>
          </div>
        </div>
        <p className="text-slate-500 text-sm">
          Last Updated: July 10, 2026. Please read our terms and conditions below carefully.
        </p>
      </section>

      {/* CORE DISCLAIMER */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-4 border-b border-slate-200 pb-2">// Disclaimer</h2>
          <p className="text-slate-700 text-sm leading-relaxed mb-6 font-semibold">
            By purchasing any software, service, subscription, or digital product from BSP Suryatech, the customer agrees to the terms and conditions outlined below.
          </p>
          <ol className="space-y-3.5 text-slate-650 text-xs sm:text-sm list-decimal pl-5 leading-relaxed font-medium">
            <li>After successful payment confirmation, our support team or engineer will contact the customer within 24 hours.</li>
            <li>Software installation, account setup, ID creation, password generation, and activation will be completed remotely through AnyDesk or other approved remote-access tools.</li>
            <li>The customer must provide accurate contact details, including a valid mobile number and email address, at the time of purchase.</li>
            <li>Customers are required to cooperate during the installation and setup process by providing necessary system access and information.</li>
            <li>BSP Suryatech is not responsible for delays caused by incorrect contact information, customer unavailability, internet issues, or device-related problems on the customer's end.</li>
          </ol>
        </div>
      </section>

      {/* REFUND POLICY SECTION */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight mb-4 border-b border-slate-200 pb-2">// Refund Policy</h2>
          <ol className="space-y-3.5 text-slate-650 text-xs sm:text-sm list-decimal pl-5 leading-relaxed font-medium">
            <li>If BSP Suryatech is unable to contact the customer within 24 hours of successful payment despite reasonable communication attempts, the customer will be eligible for a full refund.</li>
            <li>Approved refunds will be processed through the same Mode of Payment (MOP) used for the original transaction.</li>
            <li>Refund processing may take up to 7 business days, depending on banking and payment gateway procedures.</li>
            <li>Once software installation, account creation, license activation, ID generation, password generation, or service delivery has been completed, the order will be considered fulfilled and will not be eligible for a refund.</li>
            <li>Refund requests arising from customer-side issues, including system incompatibility, lack of required hardware, internet problems, or change of mind after successful service delivery, may not be eligible for a refund.</li>
            <li>BSP Suryatech reserves the right to review and approve refund requests based on the circumstances of each case.</li>
          </ol>
        </div>
      </section>

      {/* HELP & SUPPORT SUB CARD */}
      <section className="bg-[#1E293B] text-white p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
          <h3 className="font-extrabold text-white text-base">Need Assistance?</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          For any questions regarding our Disclaimer or Refund Policy, please contact our support team. We're here to help:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Email Support</span>
            <a href="mailto:bsupport@bspsuryatech.in" className="text-blue-450 font-bold hover:underline text-sm block mt-1">
              bsupport@bspsuryatech.in
            </a>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Helpline Number</span>
            <span className="font-mono text-white text-sm font-bold block mt-1">
              +91 95169 16415
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER OF POLICY */}
      <section className="pt-8 border-t border-slate-200 text-center space-y-4">
        <p className="text-xs text-slate-500 italic leading-relaxed">
          By completing a purchase on our website, you acknowledge that you have read, understood, and agreed to this Disclaimer and Refund Policy.
        </p>
        {onPageChange && (
          <button
            onClick={() => {
              onPageChange('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            I Understand & Agree
          </button>
        )}
      </section>
    </div>
  );
}
