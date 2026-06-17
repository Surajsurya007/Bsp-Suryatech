/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Download, ArrowRight, ShieldCheck, Mail, Copy, Check } from 'lucide-react';

interface PaymentSuccessProps {
  orderId: string;
  paymentId: string;
  amount: number;
  productName: string;
  onGoToDashboard: () => void;
}

export default function PaymentSuccess({
  orderId,
  paymentId,
  amount,
  productName,
  onGoToDashboard
}: PaymentSuccessProps) {
  const [copiedOrder, setCopiedOrder] = React.useState(false);
  const [copiedPayment, setCopiedPayment] = React.useState(false);

  const handleCopy = (text: string, type: 'order' | 'payment') => {
    navigator.clipboard.writeText(text);
    if (type === 'order') {
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    } else {
      setCopiedPayment(true);
      setTimeout(() => setCopiedPayment(false), 2000);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-100/50 space-y-8 relative overflow-hidden"
      >
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60" />

        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100/80"
          >
            <CheckCircle2 className="w-10 h-10" strokeWidth={1.5} />
          </motion.div>

          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight font-sans">
              Payment Completed!
            </h1>
            <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto">
              Thank you for your purchase. Your license keys are now fully active and ready to download!
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Software Package</span>
            <span className="text-xs font-black text-slate-900 font-sans">{productName}</span>
          </div>

          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Amount Paid</span>
            <span className="text-sm font-black text-slate-900 font-mono">₹{amount.toLocaleString('en-IN')}.00</span>
          </div>

          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Order Handle</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700 font-mono">{orderId}</span>
              <button 
                onClick={() => handleCopy(orderId, 'order')}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Gateway Pay ID</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 font-mono truncate max-w-[150px]">{paymentId}</span>
              <button 
                onClick={() => handleCopy(paymentId, 'payment')}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                {copiedPayment ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Verification badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[10.5px] text-slate-500 font-bold tracking-tight">Active License Secured &amp; Handshaked with Supabase Database</span>
        </div>

        {/* Call to actions */}
        <div className="pt-2 flex flex-col md:flex-row gap-4">
          <button
            onClick={onGoToDashboard}
            className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>My Licenses Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
          
          <button
            onClick={() => {
              // Direct navigation to downloads tab context
              window.location.hash = '#downloads';
              window.location.reload();
            }}
            className="px-5 py-3.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Software</span>
          </button>
        </div>

        <div className="text-center pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <Mail className="w-3.5 h-3.5" />
          <span>Need receipt help? Email client-desk support@bspsuryatech.in</span>
        </div>
      </motion.div>
    </div>
  );
}
