import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  User, 
  Tag, 
  KeyRound, 
  ArrowLeft,
  Calendar,
  IndianRupee,
  Upload,
  FileCheck,
  MessageSquare
} from 'lucide-react';

interface PaymentVerificationProps {
  user: any;
  onPageChange: (page: string) => void;
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
}

export default function PaymentVerification({
  user,
  onPageChange,
  onAddNotification,
}: PaymentVerificationProps) {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for pre-filled data
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  
  // Extra billing fields
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerGst, setCustomerGst] = useState('');

  // Additional fields for Payment Confirmation matching the spec exactly
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // 1. Read pending checkout draft from local storage
    const storedDraftJson = localStorage.getItem('bsp_pending_manual_activation');
    if (storedDraftJson) {
      try {
        const draft = JSON.parse(storedDraftJson);
        setProductId(draft.productId || 'prod-billing-pro');
        setProductName(draft.productName || 'BSP Suryatech Retail Billing Pro');
        setOrderReference(draft.orderId || '');
        setAmount(draft.amount || 3000);
        setAmountPaid((draft.amount || 3000).toString());
        setCustomerMobile(draft.customerMobile || '');
        setCustomerCompany(draft.customerCompany || '');
        setCustomerGst(draft.customerGst || '');
      } catch (err) {
        console.warn("Failed parsing storage draft:", err);
      }
    } else {
      // Fallback pre-fills if localStorage was cleared
      setProductId('prod-billing-pro');
      setProductName('BSP Suryatech Retail Billing Pro');
      setOrderReference('BSP-ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase());
      setAmount(3000);
      setAmountPaid('3000');
    }

    // 2. Read customer profiles from user session
    if (user) {
      setCustomerName(user.name || user.email?.split('@')[0] || '');
      setCustomerEmail(user.email || '');
    }
  }, [user?.id, user?.name, user?.email]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 px-6 py-10 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-6" id="verification-guest-lock">
        <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
          <KeyRound className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-sans text-white">Client Session Required</h2>
          <p className="text-xs text-slate-400">
            You must be logged in to access the payment verification desk. Please login or register to complete activation.
          </p>
        </div>
        <button
          onClick={() => onPageChange('portal')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
        >
          Go to Login Portal
        </button>
      </div>
    );
  }

  const handleCopyReference = () => {
    if (orderReference) {
      navigator.clipboard.writeText(orderReference);
      onAddNotification('Order reference copied to clipboard!', 'info');
    }
  };

  // Convert uploaded image file to live base64 string
  const handleFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onAddNotification('Please upload an image file (PNG, JPG, JPEG, standard screenshots).', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onAddNotification('File size exceeds the 8MB limit. Please upload a smaller screenshot.', 'error');
      return;
    }

    setScreenshotFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result as string);
      onAddNotification('Payment screenshot uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Drag and drop events support
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleVerifySubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    // Form inputs strict validation (Required Fields: transactionId, paymentDate, amountPaid, paymentScreenshot)
    if (!transactionId.trim()) {
      setFormError('Razorpay Transaction ID / UTR Number is required.');
      onAddNotification('Please enter your Razorpay Transaction ID or UTR Reference.', 'error');
      return;
    }

    if (!paymentDate) {
      setFormError('Payment Date is required.');
      return;
    }

    if (!amountPaid || isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
      setFormError('Please enter a valid Amount Paid.');
      return;
    }

    if (!paymentScreenshot) {
      setFormError('Payment Screenshot Upload is required to verify your transaction.');
      onAddNotification('Please upload a screenshot of your payment receipt before submitting.', 'error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/orders/verify-manual', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transactionId: transactionId.trim(),
          orderId: orderReference,
          productId,
          productName,
          customerName,
          customerEmail,
          amount: Number(amountPaid),
          paymentDate,
          amountPaid: Number(amountPaid),
          paymentScreenshot,
          remarks,
          customerMobile,
          customerCompany,
          customerGst
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit payment proof.');
      }

      setSuccessMsg('Payment submitted for verification.');
      onAddNotification('Payment submitted for verification. Admin queue alerted!', 'success');
      
      // Clean up the local storage draft after successful submission
      localStorage.removeItem('bsp_pending_manual_activation');
      
      // Reset input states
      setTransactionId('');
      setPaymentScreenshot('');
      setScreenshotFileName('');
      setRemarks('');
    } catch (err: any) {
      console.error("Submission failed:", err);
      const errMsg = err.message || 'Verification submission failed. Please try again.';
      setFormError(errMsg);
      onAddNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-slate-100" id="payment-verification-page">
      <button 
        onClick={() => onPageChange('home')}
        className="mb-6 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 text-xs font-mono rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition"
      >
        <ArrowLeft size={12} />
        <span>Back to Store Desk</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/45 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-md space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black font-sans text-white tracking-tight">Payment Submitted?</h1>
            <p className="text-sm text-slate-450 font-medium max-w-md mx-auto">
              Please provide payment details for verification.
            </p>
          </div>
        </div>

        {formError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2.5 text-xs text-left animate-shake" id="validation-error-box">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold block">Submission Conflict</strong>
              <span>{formError}</span>
            </div>
          </div>
        )}

        {successMsg ? (
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl text-center space-y-4"
            id="submission-success-panel"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Payment Submitted for Verification</h3>
              <p className="text-xs text-slate-350 max-w-sm mx-auto leading-relaxed">
                Your payment proof has been successfully logged. Your manual activation is currently <strong>Pending Verification</strong>. Our technical support team works 24/7 to crosscheck submissions. Your license will activate automatically shortly!
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
              <button
                onClick={() => {
                  onPageChange('portal');
                  window.dispatchEvent(new Event('reload_customer_datastore'));
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow"
              >
                Track Status in Customer Portal
              </button>
              <button
                onClick={() => onPageChange('home')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleVerifySubmission} className="space-y-6 text-left">
            <h2 className="text-sm font-sans font-black text-blue-400 uppercase tracking-wider block border-l-2 border-blue-500 pl-2">
              Auto-filled Details
            </h2>

            {/* Auto-filled details info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="text-slate-400 font-bold block">Product Name</label>
                <div className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-xl text-slate-300 flex items-center gap-2 select-none">
                  <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate py-0.5">{productName}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-400 font-bold block">Order Number</label>
                <div className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-xl text-slate-350 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-mono text-[11px] font-black tracking-wider truncate py-0.5 select-all">{orderReference}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="p-1 hover:bg-slate-805 text-slate-400 hover:text-white rounded transition shrink-0 cursor-pointer"
                    title="Copy Order Reference"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-400 font-bold block">Customer Name</label>
                <div className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-xl text-slate-350 flex items-center gap-2 select-none">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate py-0.5">{customerName || 'None'}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-400 font-bold block">Email Address</label>
                <div className="bg-slate-950 border border-slate-850 px-3.5 py-3 rounded-xl text-slate-350 flex items-center gap-2 select-none">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate py-0.5">{customerEmail}</span>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-sans font-black text-blue-400 uppercase tracking-wider block border-l-2 border-blue-500 pl-2 pt-2">
              Payment Verification Fields
            </h2>

            {/* CUSTOMER MUST ENTER Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Razorpay Transaction ID / UTR Number */}
              <div className="space-y-1.5 text-xs sm:col-span-2">
                <label htmlFor="transaction-id-input" className="text-white font-extrabold flex items-center gap-1">
                  <span>Razorpay Transaction ID / UTR Number</span>
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <input
                  id="transaction-id-input"
                  name="transactionId"
                  type="text"
                  placeholder="e.g. pay_OhZ8E9kLYb6x3w or UPI UTR reference"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-blue-500 text-white font-mono px-4 py-3 rounded-xl transition text-sm placeholder-slate-600 outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500">
                  Tip: Copy the payment ID from your Razorpay electronic receipt or instant SMS.
                </p>
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5 text-xs">
                <label htmlFor="payment-date-input" className="text-white font-extrabold flex items-center gap-1">
                  <span>Payment Date</span>
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <div className="relative">
                  <input
                    id="payment-date-input"
                    name="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-blue-500 text-white font-mono px-4 py-3 pr-10 rounded-xl transition text-sm outline-none"
                    required
                  />
                  <Calendar className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Amount Paid */}
              <div className="space-y-1.5 text-xs">
                <label htmlFor="amount-paid-input" className="text-white font-extrabold flex items-center gap-1">
                  <span>Amount Paid (₹)</span>
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <div className="relative">
                  <input
                    id="amount-paid-input"
                    name="amountPaid"
                    type="number"
                    placeholder="e.g. 3000"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-blue-500 text-white font-mono px-4 py-3 pl-10 rounded-xl transition text-sm outline-none"
                    required
                  />
                  <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Payment Screenshot Upload */}
            <div className="space-y-1.5 text-xs">
              <label className="text-white font-extrabold flex items-center gap-1">
                <span>Payment Screenshot Upload</span>
                <span className="text-red-500 text-xs">*</span>
              </label>

              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : paymentScreenshot 
                      ? 'border-emerald-500/40 bg-emerald-500/5' 
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('screenshot-file-picker')?.click()}
              >
                <input 
                  type="file"
                  id="screenshot-file-picker"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                
                {paymentScreenshot ? (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-mono font-black text-emerald-400 truncate max-w-sm mx-auto">
                        {screenshotFileName || "screenshotUploaded.png"}
                      </p>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentScreenshot('');
                          setScreenshotFileName('');
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-mono font-bold uppercase tracking-wider hover:underline"
                      >
                        ✕ Remove Screenshot
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 bg-slate-900 border border-slate-800 text-slate-400 rounded-full flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-300 font-bold block text-xs">
                        Click, or Drag & Drop Payment Screenshot Here
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Supports JPEG, PNG up to 8MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Remarks input */}
            <div className="space-y-1.5 text-xs">
              <label htmlFor="remarks-input" className="text-white font-extrabold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500 select-none shrink-0" />
                <span>Remarks (Optional)</span>
              </label>
              <textarea
                id="remarks-input"
                name="remarks"
                placeholder="e.g. Paid using phonepe UPI. Need urgent activation key for terminal 2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
                rows={3}
                className="w-full bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-blue-500 text-white px-4 py-3 rounded-xl transition text-sm placeholder-slate-600 outline-none resize-none"
              />
            </div>

            {/* Submit Payment button matching exact requested text */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-xl cursor-pointer flex items-center justify-center gap-1.5"
              id="verify-activate-btn"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verification in Progress...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="text-white shrink-0 font-extrabold" />
                  <span>Submit Payment For Verification</span>
                  <ArrowRight size={14} className="shrink-0 font-extrabold" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
