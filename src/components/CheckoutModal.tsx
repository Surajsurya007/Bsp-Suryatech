import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Check, 
  Info, 
  ArrowRight, 
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  CreditCard,
  QrCode,
  FileText,
  Upload,
  RefreshCw,
  Plus,
  Minus,
  ExternalLink,
  MessageSquare
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
    quantity?: number;
    price?: number;
  } | null;
  user: any;
  onSubmitSimulatedPayment?: (status: 'success' | 'failed') => void;
  onPayOnline?: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  checkoutData,
  user
}: CheckoutModalProps) {
  // Navigation Steps: 'details' | 'redirecting' | 'proof' | 'completed'
  const [step, setStep] = useState<'details' | 'redirecting' | 'proof' | 'completed'>('details');

  // Customer Forms States
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(999);
  
  // Dynamic Calculation States
  const [totalAmount, setTotalAmount] = useState(0);
  const [basePriceExclusive, setBasePriceExclusive] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Redirection and Countdown States
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimerRef = useRef<any>(null);

  // Proof Submission States
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState('');

  // Synchronize incoming metadata on active open
  useEffect(() => {
    if (isOpen && checkoutData) {
      const initialAmount = checkoutData.amount || 0;
      const initialQty = checkoutData.quantity || 1;
      
      // Calculate unit price from initial values
      let calcUnitPrice = checkoutData.price || Math.ceil(initialAmount / initialQty) || 999;
      setUnitPrice(calcUnitPrice);
      setQty(initialQty);
      setGeneratedOrderId(checkoutData.orderId || '');
      setCouponCode(checkoutData.couponCode || '');
      
      // Load customer parameters prefilled
      setCustomerName(user?.name || '');
      setCustomerEmail(user?.email || '');
      
      // Read contact details if available
      const contactInfo = user?.profile?.contactNumber || user?.profile?.contactDetails || '';
      setCustomerMobile(contactInfo);

      // Determine coupon settings if applicable
      if (checkoutData.couponCode) {
        // Simple client deduction lookup (e.g. INDIA50 = 50%, SPECIAL20 = 20%, etc.)
        const code = checkoutData.couponCode.toUpperCase();
        if (code.includes('50') || code === 'INDIA50') {
          setDiscountPercent(50);
        } else if (code.includes('20')) {
          setDiscountPercent(20);
        } else if (code.includes('10')) {
          setDiscountPercent(10);
        } else {
          setDiscountPercent(15); // standard default
        }
      } else {
        setDiscountPercent(0);
      }

      setStep('details');
      setCountdown(3);
      setTransactionId('');
      setScreenshotBase64('');
      setFileName('');
      setProofError('');
      setIsRedirecting(false);
    }
  }, [isOpen, checkoutData, user]);

  // Recalculate billing summary when quantity or discount updates
  useEffect(() => {
    const rawSubtotal = unitPrice * qty;
    const calcDiscount = Math.ceil(rawSubtotal * (discountPercent / 100));
    const calcPayable = Math.max(0, rawSubtotal - calcDiscount);
    
    // Inclusive 18% GST Calculations
    const calcBaseExclusive = parseFloat((calcPayable / 1.18).toFixed(2));
    const calcGstAmount = parseFloat((calcPayable - calcBaseExclusive).toFixed(2));

    setDiscountAmount(calcDiscount);
    setTotalAmount(calcPayable);
    setBasePriceExclusive(calcBaseExclusive);
    setGstAmount(calcGstAmount);
  }, [qty, unitPrice, discountPercent]);

  // Handle countdown triggers during Redirection Phase
  useEffect(() => {
    if (step === 'redirecting' && countdown > 0) {
      redirectTimerRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (step === 'redirecting' && countdown === 0) {
      handleOpenPaymentLink();
    }

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [step, countdown]);

  if (!isOpen || !checkoutData) return null;

  // Handle plus/minus buttons click
  const handleQuantityChange = (change: number) => {
    setQty(prev => Math.max(1, prev + change));
  };

  // Convert uploaded image file into lightweight base64 string
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setProofError('Screenshot file size exceeds 4MB limit. Please upload a compressed screenshot.');
        return;
      }

      setFileName(file.name);
      setProofError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result as string);
      };
      reader.onerror = () => {
        setProofError('Failed to read visual image file details.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 Submission: Generate order record in backend & switch to redirect countdown loader
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerMobile || !customerEmail) {
      alert('Full Name, Contact Mobile, and Email address are required fields.');
      return;
    }

    setIsRedirecting(true);
    setStep('redirecting');
    setCountdown(3);

    try {
      // Authenticated secure REST token extraction
      const token = localStorage.getItem('supabase_token') || localStorage.getItem('auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Record actual chosen parameters on the server-side datastore
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          productId: checkoutData.productId || 'prod-custom',
          couponCode: couponCode || undefined,
          quantity: qty,
          customerName,
          customerMobile,
          customerEmail
        })
      });

      if (response.ok) {
        const body = await response.json();
        // Use updated server order references
        if (body.orderId) {
          setGeneratedOrderId(body.orderId);
          setTotalAmount(body.amount);
        }
      } else {
        console.warn("[CHECKOUT CLIENT] Backend order setup response failed, utilizing fallback ID: ", generatedOrderId);
      }
    } catch (err) {
      console.error("[CHECKOUT CLIENT] Network order creation error:", err);
    } finally {
      setIsRedirecting(false);
    }
  };

  // Direct redirection to the BSP Suryatech Razorpay Payment Link
  const handleOpenPaymentLink = () => {
    // Open standard official payment link
    window.open('https://razorpay.me/@bspsuryatech', '_blank');
    
    // Switch to step 2: 'Screenshot payment verification upload page'
    setStep('proof');
  };

  // Step 2 Submission: submit Transaction ID/UTR and Payment Screenshot details
  const handleUploadPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setProofError('Transaction ID (UTR or Reference Number) is essential.');
      return;
    }

    setIsSubmittingProof(true);
    setProofError('');

    try {
      const token = localStorage.getItem('supabase_token') || localStorage.getItem('auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`[CHECKOUT APP] Submitting manual verification proof for Order: ${generatedOrderId}, UTR: ${transactionId}`);
      const res = await fetch('/api/orders/submit-proof', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          orderId: generatedOrderId,
          transactionId: transactionId,
          paymentScreenshot: screenshotBase64
        })
      });

      if (res.ok) {
        // Verification receipt saved! Go to final screen
        setStep('completed');
      } else {
        const errorBody = await res.json().catch(() => ({}));
        setProofError(errorBody.error || 'Failed to submit transaction details. Please verify connections.');
      }
    } catch (err: any) {
      console.error("[CHECKOUT APP] Network Proof Submission Error:", err);
      setProofError('Failed to communicate with authorization server. Please try again.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Sub-calculations CGST & SGST
  const cgst = parseFloat((gstAmount / 2).toFixed(2));
  const sgst = parseFloat((gstAmount / 2).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm" id="dynamic-manual-checkout-overlay">
      <div className="relative bg-white border border-slate-200 max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-slate-800" id="checkout-viewport">
        
        {/* Left column: Cart summary (Responsive Sidebar) */}
        <div className="md:w-[45%] bg-slate-50 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 text-left">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase border border-blue-100">
                GST BILLING INVOICE
              </span>
              <button 
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none">Order Details</h3>
              <p className="text-slate-550 text-xs mt-1.5 font-sans leading-relaxed">Genuine Windows Lifetime keys & installations generated at BSP Suryatech software workspace.</p>
            </div>

            {/* Shopping Cart Summary Card */}
            <div className="bg-white border p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <span className="text-[9px] font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded leading-none uppercase border border-blue-50">
                  LICENSE SUBSCRIPTION
                </span>
                <h4 className="font-extrabold text-slate-850 text-sm mt-2 leading-snug">{checkoutData.productName}</h4>
              </div>

              {/* Dynamic quantity controls (Requirement 1 & 2) */}
              {step === 'details' && (
                <div className="flex items-center justify-between py-2 border-y border-dashed border-slate-100">
                  <span className="text-xs font-medium text-slate-500">License Quantity Units:</span>
                  <div className="flex items-center gap-2.5 bg-slate-50 border p-1 rounded-lg">
                    <button 
                      type="button" 
                      onClick={() => handleQuantityChange(-1)}
                      className="p-1 hover:bg-white text-slate-600 rounded-md transition cursor-pointer"
                      title="Reduce Unit count"
                    >
                      <Minus size={13} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black font-mono text-slate-900 min-w-4 text-center">{qty}</span>
                    <button 
                      type="button" 
                      onClick={() => handleQuantityChange(1)}
                      className="p-1 hover:bg-white text-slate-600 rounded-md transition cursor-pointer"
                      title="Add Unit count"
                    >
                      <Plus size={13} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}

              {/* Precise GST & Deduction Layouts */}
              <div className="space-y-2 pt-1 font-mono text-xs text-slate-550">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>₹{unitPrice.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Quantity:</span>
                  <span>{qty} {qty > 1 ? 'Licenses' : 'License'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Valuation:</span>
                  <span>₹{(unitPrice * qty).toLocaleString('en-IN')}.00</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    <span>Discount Included:</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}.00</span>
                  </div>
                )}
                
                <div className="border-t border-dashed border-slate-150 pt-2 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Tax Exclusive Base:</span>
                    <span>₹{basePriceExclusive.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>CGST (9.0% Inclusive):</span>
                    <span>₹{cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>SGST (9.0% Inclusive):</span>
                    <span>₹{sgst.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-900 text-sm font-black pt-2 border-t border-slate-200">
                  <span>Grand Total (INR):</span>
                  <span className="text-blue-600 font-bold font-mono">₹{totalAmount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
            </div>

            {/* Helpline details */}
            <div className="text-[10px] text-slate-400 font-medium space-y-1 bg-slate-100 p-3 rounded-xl border border-slate-200/60 leading-normal">
              <p className="font-extrabold text-slate-700 font-sans uppercase tracking-wider text-[9px]">BSP Suryatech Secure Merchant Helpdesk:</p>
              <p>Email: support@bspsuryatech.in</p>
              <p>Helpline Call/WhatsApp: +91 9516916415</p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-250 flex items-center gap-2 text-[10px] text-slate-400 font-mono font-bold leading-none">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ISO 27001 Cryptographic Validation Standard</span>
          </div>
        </div>

        {/* Right column: Action Workspace views */}
        <div className="md:w-[55%] p-6 sm:p-8 flex flex-col justify-center text-left">
          
          <AnimatePresence mode="wait">
            {/* STEP 1: CUSTOMER DETAILS ENTRY */}
            {step === 'details' && (
              <motion.div 
                key="step-details"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-none">Customer Information</h3>
                  <p className="text-slate-450 text-xs mt-1.5">Please provide your legitimate business/civil particulars below to generate structural licensing.</p>
                </div>

                <form onSubmit={handleProceedToPayment} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">Full Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Suraj Surya Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">Mobile Number *</label>
                    <input 
                      type="tel"
                      required
                      placeholder="e.g. +91 95169 16415"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">Email Address *</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. support@bspsuryatech.in"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={isRedirecting}
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight size={13} strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-5 py-3 text-slate-500 hover:text-slate-800 font-extrabold text-xs uppercase tracking-wider text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: REDIRECTION SCREEN OVERLAY COUNTDOWN (Requirement 4 & 9) */}
            {step === 'redirecting' && (
              <motion.div 
                key="step-redirecting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-10 flex flex-col items-center justify-center gap-6"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-50/80 border-t-blue-600 animate-spin" />
                  <span className="absolute font-black text-blue-600 text-2xl font-mono">{countdown}</span>
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-lg font-black text-slate-850">Connecting Razorpay Portal...</h3>
                  {/* DISPLAY OF REQUIREMENT 4 NOTICE */}
                  <p className="text-blue-600 font-mono font-bold text-xs bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-150 inline-block leading-normal">
                    You are being redirected to Razorpay to pay ₹{totalAmount.toLocaleString('en-IN') || checkoutData.amount}.00
                  </p>
                  <p className="text-slate-450 text-[11px] leading-relaxed pt-2">
                    A dynamic order allocation reference has been generated on the server: <strong className="font-mono text-slate-700">{generatedOrderId}</strong>. Once paid, return here to lodge verification details.
                  </p>
                </div>

                <button
                  onClick={handleOpenPaymentLink}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-[10.5px] font-bold font-mono tracking-wide uppercase rounded-xl shadow flex items-center gap-1.5 cursor-pointer mt-4"
                >
                  <span>Launch Razorpay Instantly</span>
                  <ExternalLink size={13} />
                </button>
              </motion.div>
            )}

            {/* STEP 3: SUBMIT screenshot AND TRANSACTION ID PROOF (Requirement 5) */}
            {step === 'proof' && (
              <motion.div 
                key="step-proof"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-none">Confirm Payment Submission</h3>
                  <p className="text-slate-450 text-xs mt-1.5 leading-relaxed">Once fee deposit is finalized on Razorpay link (paying ₹{totalAmount}), copy transaction UTR details and screenshot the confirm banner to activate license.</p>
                </div>

                <form onSubmit={handleUploadPaymentProof} className="space-y-4">
                  
                  {/* Order Number display */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Invoice Amount</label>
                      <div className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 text-xs font-mono font-bold">
                        ₹{totalAmount.toLocaleString('en-IN')}.00
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Order Number *</label>
                      <input
                        type="text"
                        readOnly
                        value={generatedOrderId}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-655 text-xs font-mono font-extrabold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Transaction ID / UTR Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Transaction ID / UTR Number *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Enter 12-digit UPI UTR or Payment ID reference"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-250 rounded-xl text-slate-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Visual Dropzone for File screenshot upload */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Completed Payment Screenshot *</label>
                    <div className="border-2 border-dashed border-slate-250 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 transition relative">
                      <input 
                        type="file"
                        accept="image/*"
                        required={!screenshotBase64}
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        {screenshotBase64 ? (
                          <>
                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-800">Screenshot Uploaded successfully</span>
                            <span className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{fileName}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-7 h-7 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">Select payment confirm screenshot</span>
                            <span className="text-[10px] text-slate-400">JPEG, PNG, WEBP files up to 4MB</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {proofError && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-red-600 text-xs font-bold flex items-start gap-2 animate-pulse">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{proofError}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingProof}
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isSubmittingProof ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Submit Verification Proof</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="w-full sm:w-auto px-4 py-3 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase"
                    >
                      Modify Customer Info
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUBMISSION SUCCESS SCREEN */}
            {step === 'completed' && (
              <motion.div 
                key="step-complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 flex flex-col items-center justify-center gap-5"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Proof Received!</h3>
                  <p className="text-[#2563EB] font-bold text-xs bg-blue-50 px-3.5 py-1.5 rounded-lg border border-blue-100 inline-block font-mono mt-1">
                    Order Ref: {generatedOrderId}
                  </p>
                  <p className="text-slate-550 text-xs leading-relaxed pt-2">
                    Thank you! Our accounting team is manually reviewing your transaction (Ref: <strong className="font-mono text-slate-700">{transactionId}</strong>). Your software downloads and license serial key will update within 15-30 minutes inside your dashboard tab.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      // Redirect to User Portal Dashboard
                      window.location.hash = '#portal';
                      // Dispatch reload so user immediately sees their orders!
                      window.dispatchEvent(new Event('reload_customer_datastore'));
                    }}
                    className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer text-center"
                  >
                    Go To My Dashboard
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-3 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase text-center"
                  >
                    Close Window
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
