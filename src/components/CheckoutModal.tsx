import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  QrCode, 
  Building2, 
  Wallet, 
  X, 
  Sparkles, 
  Check, 
  Info, 
  ArrowRight, 
  LockKeyhole,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutData: {
    orderId: string;
    razorpayOrderId?: string;
    amount: number;
    keyId: string;
    productName: string;
    productId?: string;
    couponCode?: string;
  } | null;
  user: any;
  onSubmitSimulatedPayment: (status: 'success' | 'failed') => void;
  onPayOnline: () => void;
  checkoutMop: 'card' | 'upi' | 'netbanking' | 'wallet';
  setCheckoutMop: (mop: 'card' | 'upi' | 'netbanking' | 'wallet') => void;
  checkoutUpiMethod: 'vpa' | 'qr';
  setCheckoutUpiMethod: (method: 'vpa' | 'qr') => void;
  checkoutCardNo: string;
  setCheckoutCardNo: (cardNo: string) => void;
  checkoutCardExpiry: string;
  setCheckoutCardExpiry: (expiry: string) => void;
  checkoutCardCvv: string;
  setCheckoutCardCvv: (cvv: string) => void;
  checkoutUpiId: string;
  setCheckoutUpiId: (id: string) => void;
  checkoutBank: string;
  setCheckoutBank: (bank: string) => void;
  checkoutWallet: string;
  setCheckoutWallet: (wallet: string) => void;
  checkoutLoading: boolean;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  checkoutData,
  user,
  onSubmitSimulatedPayment,
  onPayOnline,
  checkoutMop,
  setCheckoutMop,
  checkoutUpiMethod,
  setCheckoutUpiMethod,
  checkoutCardNo,
  setCheckoutCardNo,
  checkoutCardExpiry,
  setCheckoutCardExpiry,
  checkoutCardCvv,
  setCheckoutCardCvv,
  checkoutUpiId,
  setCheckoutUpiId,
  checkoutBank,
  setCheckoutBank,
  checkoutWallet,
  setCheckoutWallet,
  checkoutLoading
}: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'simulated'>('online');

  if (!isOpen || !checkoutData) return null;

  // 18% inclusive GST calculations
  const totalAmount = checkoutData.amount;
  const netAmount = parseFloat((totalAmount / 1.18).toFixed(2));
  const gstAmount = parseFloat((totalAmount - netAmount).toFixed(2));
  const cgst = parseFloat((gstAmount / 2).toFixed(2));
  const sgst = parseFloat((gstAmount / 2).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm select-none" id="checkout-root-dialog">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-[#1E293B] border border-blue-500/20 max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-slate-100"
        id="checkout-inner-viewport"
      >
        {/* Left Column: Order Summary & Info */}
        <div className="md:w-[45%] bg-slate-900/60 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#2563EB] bg-blue-500/10 px-2.5 py-1 rounded-full uppercase">
                SECURE ORDER CONFIRMATION
              </span>
              <button 
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white leading-tight">Order Booking Summary</h3>
              <p className="text-slate-400 text-xs">Review the software plan purchase license particulars below before executing the transactional deposit.</p>
            </div>

            {/* Product card details */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 space-y-3">
              <div>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded uppercase">SYSTEM LICENSE</span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">{checkoutData.productName}</h4>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-800/40 font-mono text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Gross Base Value:</span>
                  <span>₹{netAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>CGST (9% Inclusive):</span>
                  <span>₹{cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>SGST (9% Inclusive):</span>
                  <span>₹{sgst.toLocaleString('en-IN')}</span>
                </div>
                {checkoutData.couponCode && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon ({checkoutData.couponCode}):</span>
                    <span>Applied</span>
                  </div>
                )}
                <div className="flex justify-between text-white text-sm font-bold pt-2 border-t border-dashed border-slate-800">
                  <span>Net Payable (INR):</span>
                  <span className="text-blue-400">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Profile Brief */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">BILLING ADDRESS REGISTER</h4>
              <div className="text-xs text-slate-350 space-y-1 bg-slate-950/20 p-3.5 rounded-xl border border-slate-850">
                <p className="font-extrabold text-white">{user?.name || user?.email?.split('@')[0]}</p>
                <p className="text-slate-400">{user?.email}</p>
                {user?.profile?.business_name && <p className="text-slate-400 font-mono text-[11px]">{user?.profile?.business_name}</p>}
                {user?.profile?.city && <p className="text-slate-400">{user?.profile?.city}, {user?.profile?.state} - {user?.profile?.pincode}</p>}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/50 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>256-bit AES Cryptographic Verification Layer</span>
          </div>
        </div>

        {/* Right Column: Payment Gateway Option Selection & Actions */}
        <div className="md:w-[55%] p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">Choose Checkout Gateway Mode</h3>
              <p className="text-slate-400 text-xs">Select either secure live cards/UPI online gateway processing or run a local memory test check.</p>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-850 rounded-xl">
              <button
                onClick={() => setSelectedMethod('online')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedMethod === 'online' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                id="checkout-select-online-tab"
              >
                <LockKeyhole size={14} />
                <span>Online Payment</span>
              </button>
              <button
                onClick={() => setSelectedMethod('simulated')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedMethod === 'simulated' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                id="checkout-select-simulated-tab"
              >
                <Sparkles size={14} />
                <span>Simulated Sandbox</span>
              </button>
            </div>

            {/* Tab content 1: Online Payment */}
            {selectedMethod === 'online' && (
              <div className="space-y-4 animate-fade-in" id="checkout-gateway-online-panel">
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 space-y-3.5">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-450 shrink-0 border border-blue-500/15">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase">Official Razorpay live payment gateway</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Launches the encrypted official Razorpay overlay. Complete UPI, credit cards, or netbanking deposits seamlessly. Upon clearance, your key generates right away.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1 text-[11px] text-slate-500 border-t border-blue-500/10 pt-2.5 font-mono">
                    <p className="flex items-center gap-1.5">✓ Cryptographic signature validation with secret key check</p>
                    <p className="flex items-center gap-1.5">✓ Secured transaction logging records registered inside Supabase</p>
                  </div>
                </div>

                <button
                  onClick={onPayOnline}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-750 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-xl cursor-pointer flex items-center justify-center gap-2"
                  id="checkout-launch-razorpay-btn"
                >
                  {checkoutLoading ? (
                    <span className="font-mono text-slate-300">Firing Secure API...</span>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Launch Razorpay Popup Payment</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab content 2: Simulated Payment */}
            {selectedMethod === 'simulated' && (
              <div className="space-y-4 animate-fade-in" id="checkout-gateway-simulated-panel">
                <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-900/20 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/10">
                      <Sparkles size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase">Simulated sandbox playground</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Bypasses live merchant banks. Select your desired payment mode below and click to trigger an instantaneous automated order response test.
                      </p>
                    </div>
                  </div>

                  {/* Payment option selectors inside simulator */}
                  <div className="grid grid-cols-4 gap-1.5 text-center font-bold text-[10px]">
                    {(['card', 'upi', 'netbanking', 'wallet'] as const).map((mop) => (
                      <button
                        key={mop}
                        type="button"
                        onClick={() => setCheckoutMop(mop)}
                        className={`py-2 rounded border uppercase font-mono ${checkoutMop === mop ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'}`}
                      >
                        {mop}
                      </button>
                    ))}
                  </div>

                  {/* Inputs based on MoP */}
                  {checkoutMop === 'card' && (
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="col-span-3">
                        <label className="text-[9.5px] text-slate-500 uppercase block mb-1">DUMMY DEBIT CARD NUMBER</label>
                        <input 
                          type="text" 
                          value={checkoutCardNo}
                          onChange={(e) => setCheckoutCardNo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-white font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9.5px] text-slate-500 uppercase block mb-1">EXPIRY DATE</label>
                        <input 
                          type="text" 
                          value={checkoutCardExpiry}
                          onChange={(e) => setCheckoutCardExpiry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-white font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-500 uppercase block mb-1">CVV</label>
                        <input 
                          type="password" 
                          value={checkoutCardCvv}
                          onChange={(e) => setCheckoutCardCvv(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-white font-bold text-center"
                        />
                      </div>
                    </div>
                  )}

                  {checkoutMop === 'upi' && (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex gap-2 p-1 bg-slate-950 rounded border border-slate-850">
                        <button
                          type="button"
                          onClick={() => setCheckoutUpiMethod('qr')}
                          className={`flex-grow py-1 rounded text-[10px] ${checkoutUpiMethod === 'qr' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                        >
                          STATIC QR SPEC
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutUpiMethod('vpa')}
                          className={`flex-grow py-1 rounded text-[10px] ${checkoutUpiMethod === 'vpa' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                        >
                          VPA HANDLE
                        </button>
                      </div>

                      {checkoutUpiMethod === 'qr' ? (
                        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded">
                          <QrCode className="w-12 h-12 text-slate-300 shrink-0" />
                          <div className="space-y-0.5 text-[11px] text-slate-400">
                            <p className="font-extrabold text-amber-500">BHIM UPI STATIC SPEC</p>
                            <p>Scans dynamically for ₹{totalAmount}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[9.5px] text-slate-500 uppercase block mb-1">UPI VPA HANDLE ID</label>
                          <input 
                            type="text" 
                            value={checkoutUpiId}
                            onChange={(e) => setCheckoutUpiId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-white font-bold"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {checkoutMop === 'netbanking' && (
                    <div className="text-xs font-mono">
                      <label className="text-[9.5px] text-slate-500 uppercase block mb-1">SELECT PREFERRED RETAIL BANK</label>
                      <select 
                        value={checkoutBank}
                        onChange={(e) => setCheckoutBank(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-white font-bold outline-none"
                      >
                        <option value="SBI">State Bank of India (SBI)</option>
                        <option value="HDFC">HDFC Retail Banking</option>
                        <option value="ICICI">ICICI Corporate / Retail</option>
                        <option value="AXIS">Axis Bank Secure Net</option>
                        <option value="PNB">Punjab National Bank</option>
                      </select>
                    </div>
                  )}

                  {checkoutMop === 'wallet' && (
                    <div className="text-xs font-mono">
                      <label className="text-[9.5px] text-slate-500 uppercase block mb-1">SELECT DESIGNATED E-WALLET</label>
                      <select 
                        value={checkoutWallet}
                        onChange={(e) => setCheckoutWallet(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-white font-bold outline-none"
                      >
                        <option value="paytm">PayTM Wallet Balance</option>
                        <option value="phonepe">PhonePe Wallet</option>
                        <option value="amazonpay">Amazon Pay Balance</option>
                        <option value="mobikwik">MobiKwik Instadebit</option>
                      </select>
                    </div>
                  )}

                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onSubmitSimulatedPayment('success')}
                    disabled={checkoutLoading}
                    className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer disabled:opacity-50"
                  >
                    Simulate Payment Success
                  </button>
                  <button
                    onClick={() => onSubmitSimulatedPayment('failed')}
                    disabled={checkoutLoading}
                    className="px-4 py-3 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                  >
                    Simulate Fail
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800/50 text-center">
            <button 
              onClick={onClose}
              disabled={checkoutLoading}
              className="text-xs text-slate-450 hover:text-white transition underline font-medium cursor-pointer"
            >
              Cancel order process & resume cart shopping
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
