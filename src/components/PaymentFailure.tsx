/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, PhoneCall, ArrowLeft, Mail } from 'lucide-react';

interface PaymentFailureProps {
  errorMessage: string;
  onRetry: () => void;
  onGoBack: () => void;
}

export default function PaymentFailure({
  errorMessage,
  onRetry,
  onGoBack
}: PaymentFailureProps) {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-100/50 space-y-8 relative overflow-hidden"
      >
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 via-rose-500 to-red-650" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-60" />

        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 border border-rose-100/80"
          >
            <AlertTriangle className="w-10 h-10" strokeWidth={1.5} />
          </motion.div>

          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight font-sans">
              Payment Failed or Cancelled
            </h1>
            <p className="text-slate-550 text-xs font-semibold max-w-sm mx-auto">
              We couldn't finalize your transaction. Please inspect the diagnostic message below.
            </p>
          </div>
        </div>

        {/* Diagnosis Console */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Error Diagnostics</span>
          <p className="text-xs font-mono font-bold text-rose-600 leading-relaxed bg-white border border-rose-100 p-3.5 rounded-xl">
            {errorMessage || 'The payment process was closed, declined, or timed out. No amount has been debited.'}
          </p>
        </div>

        {/* Recommendations block */}
        <div className="space-y-3.5 text-xs text-slate-500">
          <span className="text-[10.5px] font-extrabold text-slate-800 uppercase tracking-wider block">Recommended Actions:</span>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>Ensure your UPI app is connected to the internet and has correct account balances.</li>
            <li>Do not close or reload the payment gateway while authentication is active.</li>
            <li>If funds were deducted from your bank, please keep UPI receipt references. Your serial keys will auto-generate once verified by our system.</li>
          </ul>
        </div>

        {/* Call to actions */}
        <div className="pt-2 flex flex-col md:flex-row gap-4">
          <button
            onClick={onRetry}
            className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Secure Checkout</span>
          </button>
          
          <button
            onClick={onGoBack}
            className="px-5 py-3.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Store Products</span>
          </button>
        </div>

        {/* Support Grid */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
          <div className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 transition rounded-xl">
            <PhoneCall className="w-4 h-4 text-slate-500 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Helpline Support</span>
            <span className="text-[11px] font-extrabold text-slate-800 tracking-tight font-mono">+91 95169 16415</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 transition rounded-xl">
            <Mail className="w-4 h-4 text-slate-500 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Inquiry</span>
            <span className="text-[11px] font-extrabold text-blue-600 tracking-tight">support@bspsuryatech.in</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
